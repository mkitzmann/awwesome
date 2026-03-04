/**
 * One-time backfill: fetch ~12 months of star history for all GitHub-hosted projects
 * using the page-sampling technique (inspired by star-history / starcharts).
 *
 * Usage: TOKEN_GITHUB=ghp_xxx npm run backfill-stars
 *
 * How it works:
 *   1. Fetches page 1 of /repos/{owner}/{repo}/stargazers with the star+json accept header
 *   2. Parses the Link header to find the total number of pages
 *   3. Picks ~12 evenly-spaced pages across the range
 *   4. Fetches only the first stargazer from each sampled page
 *   5. Each sample gives (starred_at date, approximate cumulative star count)
 *   6. Stores monthly data points in star_history
 *
 * Idempotent: skips projects that already have >= 2 star_history records.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = process.env.DATABASE_URL || path.resolve(PROJECT_ROOT, 'data/awwesome.db');

const GITHUB_TOKEN = process.env.TOKEN_GITHUB || '';
const PER_PAGE = 100;
const MAX_SAMPLES = 12;
const RATE_LIMIT_PAUSE_MS = 60_000;
const REQUEST_DELAY_MS = 50; // small delay between requests to be polite

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

// ── GitHub API helpers ──

interface StargazerEntry {
	starred_at: string;
	user: { login: string };
}

async function githubFetch(url: string): Promise<Response> {
	const res = await fetch(url, {
		headers: {
			Accept: 'application/vnd.github.v3.star+json',
			Authorization: `token ${GITHUB_TOKEN}`,
			'User-Agent': 'awwesome-backfill'
		}
	});

	if (res.status === 403 || res.status === 429) {
		const resetHeader = res.headers.get('x-ratelimit-reset');
		const resetMs = resetHeader
			? (Number(resetHeader) * 1000 - Date.now())
			: RATE_LIMIT_PAUSE_MS;
		const waitMs = Math.max(resetMs, 10_000);
		console.warn(`   Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s...`);
		await sleep(waitMs);
		return githubFetch(url); // retry once after waiting
	}

	return res;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractOwnerRepo(url: string): { owner: string; repo: string } | null {
	const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
	if (!match) return null;
	return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

function parseTotalPages(linkHeader: string | null): number {
	if (!linkHeader) return 1;
	const match = /[&?]page=(\d+)[^>]*>;\s*rel="last"/.exec(linkHeader);
	return match ? Number(match[1]) : 1;
}

function calculateSamplePages(totalPages: number, maxSamples: number): number[] {
	if (totalPages <= maxSamples) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const pages: number[] = [];
	for (let i = 1; i <= maxSamples; i++) {
		const page = Math.max(1, Math.round((i * totalPages) / maxSamples));
		pages.push(page);
	}
	// Always include page 1
	if (pages[0] !== 1) pages[0] = 1;

	// Deduplicate
	return [...new Set(pages)];
}

// ── Core backfill logic ──

async function fetchStarHistory(
	owner: string,
	repo: string,
	currentStars: number
): Promise<{ date: string; stars: number }[]> {
	const baseUrl = `https://api.github.com/repos/${owner}/${repo}/stargazers?per_page=${PER_PAGE}`;

	// Step 1: Fetch page 1 to discover total pages
	const firstRes = await githubFetch(`${baseUrl}&page=1`);
	if (!firstRes.ok) {
		if (firstRes.status === 404) return []; // repo not found / private
		throw new Error(`GitHub API error ${firstRes.status} for ${owner}/${repo}`);
	}

	const totalPages = parseTotalPages(firstRes.headers.get('link'));
	const firstPageData = (await firstRes.json()) as StargazerEntry[];

	if (firstPageData.length === 0) return [];

	// Step 2: Pick sample pages
	const samplePages = calculateSamplePages(totalPages, MAX_SAMPLES);

	// Step 3: Fetch sampled pages (page 1 already fetched)
	const dataPoints: { date: string; stars: number }[] = [];

	for (const page of samplePages) {
		let entry: StargazerEntry | undefined;

		if (page === 1) {
			entry = firstPageData[0];
		} else {
			await sleep(REQUEST_DELAY_MS);
			const res = await githubFetch(`${baseUrl}&page=${page}`);
			if (!res.ok) continue;
			const data = (await res.json()) as StargazerEntry[];
			if (data.length === 0) continue;
			entry = data[0];
		}

		if (entry) {
			const starCount = PER_PAGE * (page - 1) + 1;
			const date = entry.starred_at.slice(0, 10); // YYYY-MM-DD
			dataPoints.push({ date, stars: starCount });
		}
	}

	// Step 4: Append current star count as today's data point
	const today = new Date().toISOString().slice(0, 10);
	dataPoints.push({ date: today, stars: currentStars });

	return dataPoints;
}

// ── Main ──

async function main() {
	console.log('=== Star history backfill ===');
	console.log(`Database: ${DB_PATH}`);
	console.log(`Samples per repo: ${MAX_SAMPLES}\n`);

	// Find all projects with a GitHub source_url that don't have star history yet
	const projects = sqlite
		.prepare(`
			SELECT p.id, p.name, p.source_url, p.stars
			FROM projects p
			WHERE p.source_url LIKE '%github.com/%'
			  AND p.stars IS NOT NULL
			  AND p.stars > 0
			  AND (SELECT COUNT(*) FROM star_history sh WHERE sh.project_id = p.id) < 2
			ORDER BY p.stars DESC
		`)
		.all() as { id: number; name: string; source_url: string; stars: number }[];

	console.log(`Found ${projects.length} projects to backfill.\n`);

	// Check rate limit before starting
	const rateLimitRes = await githubFetch('https://api.github.com/rate_limit');
	if (rateLimitRes.ok) {
		const rl = (await rateLimitRes.json()) as { resources: { core: { remaining: number; limit: number } } };
		console.log(`GitHub API rate limit: ${rl.resources.core.remaining}/${rl.resources.core.limit} remaining\n`);
	}

	let completed = 0;
	let failed = 0;
	let skipped = 0;

	const insertBatch = sqlite.transaction(
		(rows: { projectId: number; date: string; stars: number }[]) => {
			for (const row of rows) {
				insertStarHistory.run(row.projectId, row.date, row.stars);
			}
		}
	);

	for (const project of projects) {
		const parsed = extractOwnerRepo(project.source_url);
		if (!parsed) {
			skipped++;
			continue;
		}

		try {
			const history = await fetchStarHistory(parsed.owner, parsed.repo, project.stars);
			if (history.length === 0) {
				skipped++;
				continue;
			}

			insertBatch(history.map((h) => ({ projectId: project.id, date: h.date, stars: h.stars })));
			completed++;

			if (completed % 50 === 0) {
				console.log(`   Progress: ${completed}/${projects.length} (${failed} failed, ${skipped} skipped)`);
			}
		} catch (err) {
			failed++;
			console.warn(`   Failed: ${project.name} (${parsed.owner}/${parsed.repo}): ${err}`);
		}
	}

	console.log(`\n=== Backfill complete ===`);
	console.log(`   Completed: ${completed}`);
	console.log(`   Failed: ${failed}`);
	console.log(`   Skipped: ${skipped}`);

	sqlite.close();
}

main().catch((err) => {
	console.error('Backfill failed:', err);
	process.exit(1);
});
