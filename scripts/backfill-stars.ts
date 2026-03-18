/**
 * Backfill star_history with daily data points for the last 30 days.
 * Uses the GitHub GraphQL API to count recent stargazers efficiently.
 * Runs 10 workers in parallel for speed.
 *
 * Usage: yarn run backfill-stars
 *
 * How it works:
 *   1. Queries stargazers ordered by STARRED_AT DESC (most recent first)
 *   2. Pages through until finding a starredAt older than 30 days
 *   3. Computes the star count at end-of-day for each of the last 30 days
 *   4. Stores all 31 daily data points (today + 30 prior days) in star_history
 *
 * Idempotent: skips projects that already have >= 2 star_history records.
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = process.env.DATABASE_URL || path.resolve(PROJECT_ROOT, 'data/awwesome.db');

const GITHUB_TOKEN = process.env.TOKEN_GITHUB || '';
const RATE_LIMIT_PAUSE_MS = 60_000;
const CONCURRENCY = 10;
const THIRTY_DAYS_AGO_ISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

if (!GITHUB_TOKEN) {
	console.error('Error: TOKEN_GITHUB environment variable is required.');
	console.error('Usage: TOKEN_GITHUB=ghp_xxx npm run backfill-stars');
	process.exit(1);
}

// ── Database setup ──

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

const insertStarHistory = sqlite.prepare(`
	INSERT INTO star_history (project_id, recorded_at, stars)
	VALUES (?, ?, ?)
	ON CONFLICT(project_id, recorded_at) DO UPDATE SET stars = excluded.stars
`);

// ── GitHub GraphQL helpers ──

interface StargazerEdge {
	starredAt: string;
}

interface GraphQLResponse {
	data?: {
		repository?: {
			stargazers: {
				totalCount: number;
				pageInfo: { hasNextPage: boolean; endCursor: string | null };
				edges: StargazerEdge[];
			};
		};
		rateLimit?: { remaining: number; limit: number; cost: number };
	};
	errors?: { message: string }[];
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let apiPointsUsed = 0;
let apiLimit = 5000;

async function graphqlFetch(
	query: string,
	variables: Record<string, string | null>
): Promise<GraphQLResponse> {
	const res = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `bearer ${GITHUB_TOKEN}`,
			'Content-Type': 'application/json',
			'User-Agent': 'awwesome-backfill'
		},
		body: JSON.stringify({ query, variables })
	});

	if (res.status === 403 || res.status === 429) {
		const resetHeader = res.headers.get('x-ratelimit-reset');
		const resetMs = resetHeader ? Number(resetHeader) * 1000 - Date.now() : RATE_LIMIT_PAUSE_MS;
		const waitMs = Math.max(resetMs, 10_000);
		console.warn(`   Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s...`);
		await sleep(waitMs);
		return graphqlFetch(query, variables);
	}

	const json = (await res.json()) as GraphQLResponse;

	if (json.data?.rateLimit) {
		apiPointsUsed += json.data.rateLimit.cost;
		apiLimit = json.data.rateLimit.limit;
	}

	return json;
}

function extractOwnerRepo(url: string): { owner: string; repo: string } | null {
	const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
	if (!match) return null;
	return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

// ── Core logic ──

const STARGAZERS_QUERY = `
	query($owner: String!, $repo: String!, $cursor: String) {
		repository(owner: $owner, name: $repo) {
			stargazers(first: 100, orderBy: {field: STARRED_AT, direction: DESC}, after: $cursor) {
				totalCount
				pageInfo {
					hasNextPage
					endCursor
				}
				edges {
					starredAt
				}
			}
		}
		rateLimit {
			remaining
			limit
			cost
		}
	}
`;

async function fetchDailyStarCounts(
	owner: string,
	repo: string
): Promise<{ totalStars: number; dailyCounts: Map<string, number>; requests: number } | null> {
	let cursor: string | null = null;
	const starsPerDay = new Map<string, number>();
	let requests = 0;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		requests++;
		const result = await graphqlFetch(STARGAZERS_QUERY, { owner, repo, cursor });

		if (result.errors?.length) {
			throw new Error(result.errors[0].message);
		}

		const repoData = result.data?.repository;
		if (!repoData) return null;

		const { totalCount, pageInfo, edges } = repoData.stargazers;

		let foundBoundary = false;
		for (const edge of edges) {
			if (edge.starredAt < THIRTY_DAYS_AGO_ISO) {
				foundBoundary = true;
				break;
			}
			const day = edge.starredAt.slice(0, 10);
			starsPerDay.set(day, (starsPerDay.get(day) || 0) + 1);
		}

		if (foundBoundary || !pageInfo.hasNextPage) {
			const dailyCounts = new Map<string, number>();
			let starsAfter = 0;

			for (let i = 0; i <= 30; i++) {
				const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
				dailyCounts.set(date, totalCount - starsAfter);
				starsAfter += starsPerDay.get(date) || 0;
			}

			return { totalStars: totalCount, dailyCounts, requests };
		}

		cursor = pageInfo.endCursor;
	}
}

// ── Main ──

async function main() {
	console.log('=== Star history backfill (GraphQL, last 30 days) ===');
	console.log(`Database: ${DB_PATH}`);
	console.log(`Concurrency: ${CONCURRENCY} workers\n`);

	const projects = sqlite
		.prepare(
			`
			SELECT p.id, p.name, p.source_url, p.stars
			FROM projects p
			WHERE p.source_url LIKE '%github.com/%'
			  AND p.stars IS NOT NULL
			  AND p.stars > 0
			  AND (SELECT COUNT(*) FROM star_history sh WHERE sh.project_id = p.id) < 2
			ORDER BY p.stars DESC
		`
		)
		.all() as { id: number; name: string; source_url: string; stars: number }[];

	console.log(`Found ${projects.length} projects to backfill.\n`);

	let completed = 0;
	let failed = 0;
	let skipped = 0;

	const insertBatch = sqlite.transaction((projectId: number, dailyCounts: Map<string, number>) => {
		for (const [date, stars] of dailyCounts) {
			insertStarHistory.run(projectId, date, stars);
		}
	});

	function updateStatus() {
		const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
		process.stdout.write(
			`\r   ${completed}/${projects.length} done | ${failed} failed | ${skipped} skipped | ${apiPointsUsed}/${apiLimit} API points | ${elapsed}s`
		);
	}

	const startTime = Date.now();
	const statusInterval = setInterval(updateStatus, 200);

	async function processProject(project: {
		id: number;
		name: string;
		source_url: string;
		stars: number;
	}) {
		const parsed = extractOwnerRepo(project.source_url);
		if (!parsed) {
			skipped++;
			return;
		}

		try {
			const result = await fetchDailyStarCounts(parsed.owner, parsed.repo);
			if (!result) {
				skipped++;
				return;
			}

			insertBatch(project.id, result.dailyCounts);
			completed++;

			const today = new Date().toISOString().slice(0, 10);
			const oldest = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
			const delta = (result.dailyCounts.get(today) || 0) - (result.dailyCounts.get(oldest) || 0);

			if (completed <= 5) {
				process.stdout.write('\n');
				console.log(
					`   ${project.name}: ${result.totalStars} stars (+${delta} in 30d) ${result.requests} req`
				);
			}
		} catch (err) {
			failed++;
			process.stdout.write('\n');
			console.warn(`   Failed: ${project.name} (${parsed.owner}/${parsed.repo}): ${err}`);
		}
	}

	// Process projects with N concurrent workers
	let index = 0;
	async function worker() {
		while (index < projects.length) {
			const project = projects[index++];
			await processProject(project);
		}
	}

	const workers = Array.from({ length: CONCURRENCY }, () => worker());
	await Promise.all(workers);

	clearInterval(statusInterval);
	const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

	console.log(`\n\n=== Backfill complete in ${totalElapsed}s ===`);
	console.log(`   Completed: ${completed}`);
	console.log(`   Failed: ${failed}`);
	console.log(`   Skipped: ${skipped}`);
	console.log(`   API points used: ${apiPointsUsed}/${apiLimit}`);

	sqlite.close();
}

main().catch((err) => {
	console.error('Backfill failed:', err);
	process.exit(1);
});
