/**
 * Seed script: Fetches projects from Awesome lists, enriches with GitHub data,
 * and stores everything in the SQLite database.
 *
 * Usage: npm run seed
 * Requires TOKEN_GITHUB environment variable.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from '../src/lib/server/db/schema.js';

// ── Setup database ──

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_URL || path.resolve(__dirname, '../data/awwesome.db');
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

// ── Inline the necessary functions to avoid SvelteKit module resolution issues ──

import slugify from '@sindresorhus/slugify';

// Config
const config = {
	chunkSize: process.env.CHUNK_SIZE ? Number(process.env.CHUNK_SIZE) : 20,
	requestDelay: process.env.REQUEST_DELAY ? Number(process.env.REQUEST_DELAY) : 0,
	urls: [
		'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md',
		'https://raw.githubusercontent.com/awesome-foss/awesome-sysadmin/master/README.md'
	]
};

// Types (minimal subset for seed)
interface Project {
	name: string | null;
	primary_url: string | null;
	source_url?: string | null;
	demo_url?: string | null;
	description?: string | null;
	license?: { name?: string; description?: string; url?: string; nickname?: string };
	stack?: string | null;
	category?: string;
	stars?: number | null;
	avatar_url?: string | null;
	topics?: string[];
	commit_history?: { [key: string]: number };
	pushedAt?: Date;
	firstAdded?: Date;
	createdAt?: Date;
}

interface Category {
	slug: string;
	name: string;
	children?: Category[];
}

interface AllCategories {
	tree: Category[];
	urls: Set<string>;
	names: { [key: string]: string };
}

// ── Markdown parsing (from repositories.ts) ──

function removeTrailingSlashes(input?: string | unknown): string | undefined {
	if (!input || typeof input !== 'string') return undefined;
	return input.replace(/\/$/, '');
}

function extractName(input: string) {
	const regex = /\[([^\]]+)\]\(/;
	const match = input.match(regex);
	return match ? match[1].trim() : null;
}

function extractPrimaryUrl(input: string) {
	const regex = /\((https?:\/\/[^)]+)\)/;
	const match = input.match(regex);
	return match ? removeTrailingSlashes(match[1].trim()) ?? null : null;
}

function extractDescription(input: string) {
	const regex = /-\s*\[(?:[^\]]+)\]\([^)]+\)\s*-\s*(.+?)(?:\s*\(|`)/;
	const match = input.match(regex);
	return match ? match[1]?.trim() : undefined;
}

function extractStack(input: string) {
	const regex = /`([^`]+)`\s*`([^`]+)`$/;
	const match = input.match(regex);
	return match ? match[1].trim() : undefined;
}

function extractLicense(input: string) {
	const regex = /`([^`]+)`\s*`([^`]+)`$/;
	const match = input.match(regex);
	return match ? match[0].trim() : undefined;
}

function extractSourceUrl(input: string) {
	const regex = /\[Source Code\]\(([^)]+)/;
	const match = input.match(regex);
	return match ? removeTrailingSlashes(match[1].trim()) : undefined;
}

function extractDemoUrl(input: string) {
	const regex = /\[Demo\]\(([^)]+)/;
	const match = input.match(regex);
	return match ? match[1].trim() : undefined;
}

function extractCategory(line: string) {
	return line.slice(4).trim().split(' - ');
}

function transformObjectToArray(obj: Record<string, any>): Category[] {
	const array: Category[] = [];
	for (const key in obj) {
		const entry: Category = { name: key, slug: slugify(key), children: [] };
		if (Object.keys(obj[key]).length > 0) {
			entry.children = transformObjectToArray(obj[key]);
		}
		array.push(entry);
	}
	return array;
}

function extractRepositories(markdownText: string): { projects: Project[]; categories: AllCategories } {
	const lines = markdownText.split('\n');
	const projects: Project[] = [];
	let currentCategoryURL = '';
	const allCategoriesObject: Record<string, any> = {};
	const allCategories: AllCategories = { tree: [], names: {}, urls: new Set() };

	for (const line of lines) {
		if (line.startsWith('### ')) {
			const currentCategoryNames = extractCategory(line);
			if (currentCategoryNames[0] === 'Backup') {
				currentCategoryNames[0] = 'Backups';
			}
			currentCategoryURL = '';
			currentCategoryNames.forEach((categoryName) => {
				allCategories.names[slugify(categoryName)] = categoryName;
				currentCategoryURL = `${currentCategoryURL}/${slugify(categoryName)}`;
				allCategories.urls.add(currentCategoryURL);
			});
			[...currentCategoryNames].reduce(
				(prev: any, current: string) => (prev[current] = prev[current] ?? {}),
				allCategoriesObject
			);
			allCategories.tree = transformObjectToArray(allCategoriesObject);
			continue;
		}
		if (!line.startsWith('- [')) continue;
		if (!extractPrimaryUrl(line)) continue;

		const project: Project = {
			name: extractName(line),
			primary_url: extractPrimaryUrl(line),
			description: extractDescription(line),
			stack: extractStack(line),
			license: extractLicense(line) ? { name: extractLicense(line) } : undefined,
			source_url: extractSourceUrl(line),
			demo_url: extractDemoUrl(line),
			category: currentCategoryURL
		};
		projects.push(project);
	}

	allCategories.tree = allCategories.tree.sort((a, b) => a.slug.localeCompare(b.slug));
	return { projects, categories: allCategories };
}

async function combineSources(urls: string[]): Promise<string> {
	let combined = '';
	for (const url of urls) {
		const response = await fetch(url);
		combined += await response.text();
	}
	return combined;
}

// ── GitHub API (from fetch-github.ts + query.ts) ──

interface MonthInfo {
	name: string;
	since: string;
	until: string;
}

function getLast12Months(): MonthInfo[] {
	const currentDate = new Date(new Date().setHours(0, 0, 0, 0));
	const months: MonthInfo[] = [];
	for (let i = 0; i < 12; i++) {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth() - i;
		const firstDay = new Date(year, month, 2);
		firstDay.setUTCHours(0, 0, 0, 0);
		const nextMonth = new Date(year, month + 1, 1);
		nextMonth.setUTCHours(0, 0, 0, 0);
		months.unshift({
			name: firstDay.toISOString().slice(0, 7).replace('-', ''),
			since: firstDay.toISOString(),
			until: nextMonth.toISOString()
		});
	}
	return months;
}

function createQuery(urls: string[]): string {
	const searchString = `repo:${urls
		.map((url) => url?.replace('https://github.com/', ''))
		.join(' repo:')}`;
	const months = getLast12Months();
	return `
	query {
	  search(
		type:REPOSITORY,
		query: "${searchString}",
		first: ${config.chunkSize + 10}
	  ) {
		repos: edges {
		  repo: node {
			... on Repository {
					createdAt
          url
          name
          owner {
            avatarUrl
          }
          descriptionHTML
          stargazerCount
					licenseInfo {
            url
            name
            nickname
          }
          pushedAt
					repositoryTopics(first: 10) {
					  edges {
					    node {
					      topic {
					        name
					      }
					    }
					  }
					}
          defaultBranchRef {
            target {
              ... on Commit {
              	${months
									.map(
										(month) =>
											`m${month.name}: history(since: "${month.since}", until: "${month.until}") {\n\ttotalCount\n}`
									)
									.join('\n')}
              }
            }
					}
        }
		  }
		}
	  }
		rateLimit {
			limit
			cost
			remaining
			resetAt
		}
	}
	`;
}

function extractGithubRepoUrls(projects: Project[]): Set<string> {
	const githubRepoUrls = new Set<string>();
	for (const project of projects) {
		let url: string | undefined;
		if (project.source_url?.includes('github.com')) url = project.source_url;
		if (project.primary_url?.includes('github.com')) url = project.primary_url;
		if (url) githubRepoUrls.add(removeTrailingSlashes(url) ?? url);
	}
	return githubRepoUrls;
}

async function fetchGithubRequest(query: string) {
	const token = process.env.TOKEN_GITHUB;
	if (!token) throw new Error('TOKEN_GITHUB environment variable is required');
	return fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'bearer ' + token
		},
		body: JSON.stringify({ query })
	});
}

interface GithubRepo {
	url: string;
	name: string;
	owner?: { avatarUrl: string };
	createdAt?: string;
	descriptionHTML?: string;
	licenseInfo?: { name: string; description: string; url: string; nickname: string };
	stargazerCount?: number;
	repositoryTopics: { edges: { node: { topic: { name: string } } }[] };
	defaultBranchRef: { target: { [key: string]: { totalCount: number } } };
	pushedAt: string;
}

async function fetchRepoInfoFromGithub(query: string): Promise<GithubRepo[]> {
	let response = await fetchGithubRequest(query);

	if (response.status === 502) {
		for (let i = 0; i < 4; i++) {
			console.log(`received 502 error, retrying ${i + 1} of 4`);
			response = await fetchGithubRequest(query);
			if (response.ok) break;
		}
	}

	if (response.ok) {
		const { data } = await response.json();
		console.log(
			`Repos: ${data.search.repos.length}, API cost: ${data.rateLimit.cost}, remaining: ${data.rateLimit.remaining}`
		);
		return data.search.repos.map((d: any) => d.repo);
	}

	throw new Error(`GitHub API error: ${response.statusText}`);
}

function delay(ms: number) {
	return new Promise((res) => setTimeout(res, ms));
}

async function fetchAllGithubRepositories(allProjects: Project[]): Promise<GithubRepo[]> {
	const githubRepoUrls = extractGithubRepoUrls(allProjects);
	const urls = [...githubRepoUrls];
	let data: GithubRepo[] = [];

	console.log(`Fetching ${urls.length} GitHub repos in chunks of ${config.chunkSize}...`);

	for (let i = 0; i < urls.length; i += config.chunkSize) {
		const chunk = urls.slice(i, i + config.chunkSize);
		const query = createQuery(chunk);
		const result = await fetchRepoInfoFromGithub(query);
		data = data.concat(result);
		console.log(`  chunk ${Math.floor(i / config.chunkSize) + 1}/${Math.ceil(urls.length / config.chunkSize)} done (${data.length} repos total)`);

		if (config.requestDelay > 0) {
			await delay(config.requestDelay);
		}
	}

	return data;
}

function mapProjectToRepo(data: GithubRepo[], project: Project): { project: Project; found: boolean } {
	const repo = data.find(
		(repo) =>
			repo.url.toLowerCase() === project.primary_url?.toLowerCase() ||
			repo.url.toLowerCase() === project.source_url?.toLowerCase()
	);
	if (!repo) return { project, found: false };

	project.stars = repo.stargazerCount ?? undefined;
	project.description = repo.descriptionHTML ?? project.description ?? undefined;
	project.avatar_url = repo.owner?.avatarUrl ? repo.owner.avatarUrl.slice(0, -4) + '?size=80' : undefined;
	project.commit_history = Object.entries(repo.defaultBranchRef.target).reduce(
		(prev: Record<string, number>, entry) => {
			prev[entry[0]] = entry[1].totalCount;
			return prev;
		},
		{}
	);
	project.license = repo.licenseInfo ?? undefined;
	project.pushedAt = new Date(repo.pushedAt);
	project.createdAt = repo.createdAt ? new Date(repo.createdAt) : undefined;
	project.topics = repo.repositoryTopics?.edges?.map((edge) => edge.node.topic.name) ?? [];

	return { project, found: true };
}

// ── Database operations ──

function createTables() {
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL,
			name TEXT NOT NULL,
			parent_id INTEGER REFERENCES categories(id),
			full_path TEXT NOT NULL UNIQUE
		);
		CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
		CREATE INDEX IF NOT EXISTS idx_categories_full_path ON categories(full_path);

		CREATE TABLE IF NOT EXISTS projects (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			primary_url TEXT UNIQUE,
			source_url TEXT,
			demo_url TEXT,
			description TEXT,
			license_name TEXT,
			license_url TEXT,
			license_nickname TEXT,
			stack TEXT,
			category_id INTEGER NOT NULL REFERENCES categories(id),
			stars INTEGER,
			avatar_url TEXT,
			pushed_at TEXT,
			created_at TEXT,
			first_added TEXT,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
		CREATE INDEX IF NOT EXISTS idx_projects_stars ON projects(stars);

		CREATE TABLE IF NOT EXISTS project_topics (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			topic TEXT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_project_topics_project_id ON project_topics(project_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_project_topics_unique ON project_topics(project_id, topic);

		CREATE TABLE IF NOT EXISTS commit_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			month_key TEXT NOT NULL,
			commit_count INTEGER NOT NULL DEFAULT 0
		);
		CREATE INDEX IF NOT EXISTS idx_commit_history_project_id ON commit_history(project_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_commit_history_unique ON commit_history(project_id, month_key);

		CREATE TABLE IF NOT EXISTS crawl_log (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			started_at TEXT NOT NULL,
			finished_at TEXT,
			projects_found INTEGER DEFAULT 0,
			projects_enriched INTEGER DEFAULT 0,
			status TEXT DEFAULT 'running'
		);
	`);
}

function upsertCategoryPath(fullPath: string, slugToName: Record<string, string>): number {
	const parts = fullPath.split('/').filter(Boolean);
	let parentId: number | null = null;
	let currentPath = '';
	let lastId = 0;

	for (const slug of parts) {
		currentPath += '/' + slug;
		const name = slugToName[slug] || slug;

		const existing = db
			.select({ id: schema.categories.id })
			.from(schema.categories)
			.where(sql`${schema.categories.fullPath} = ${currentPath}`)
			.get();

		if (existing) {
			parentId = existing.id;
			lastId = existing.id;
		} else {
			const result = db
				.insert(schema.categories)
				.values({ slug, name, parentId, fullPath: currentPath })
				.returning({ id: schema.categories.id })
				.get();
			parentId = result.id;
			lastId = result.id;
		}
	}

	return lastId;
}

function upsertProject(project: Project, categoryId: number): number {
	const existing = db
		.select({ id: schema.projects.id, firstAdded: schema.projects.firstAdded })
		.from(schema.projects)
		.where(sql`${schema.projects.primaryUrl} = ${project.primary_url}`)
		.get();

	if (existing) {
		db.update(schema.projects)
			.set({
				name: project.name,
				sourceUrl: project.source_url ?? null,
				demoUrl: project.demo_url ?? null,
				description: project.description ?? null,
				licenseName: project.license?.name ?? null,
				licenseUrl: project.license?.url ?? null,
				licenseNickname: project.license?.nickname ?? null,
				stack: project.stack ?? null,
				categoryId,
				stars: project.stars ?? null,
				avatarUrl: project.avatar_url ?? null,
				pushedAt: project.pushedAt?.toISOString() ?? null,
				createdAt: project.createdAt?.toISOString() ?? null,
				firstAdded:
					existing.firstAdded ??
					project.firstAdded?.toISOString() ??
					project.createdAt?.toISOString() ??
					null,
				updatedAt: new Date().toISOString()
			})
			.where(sql`${schema.projects.id} = ${existing.id}`)
			.run();
		return existing.id;
	}

	const result = db
		.insert(schema.projects)
		.values({
			name: project.name,
			primaryUrl: project.primary_url,
			sourceUrl: project.source_url ?? null,
			demoUrl: project.demo_url ?? null,
			description: project.description ?? null,
			licenseName: project.license?.name ?? null,
			licenseUrl: project.license?.url ?? null,
			licenseNickname: project.license?.nickname ?? null,
			stack: project.stack ?? null,
			categoryId,
			stars: project.stars ?? null,
			avatarUrl: project.avatar_url ?? null,
			pushedAt: project.pushedAt?.toISOString() ?? null,
			createdAt: project.createdAt?.toISOString() ?? null,
			firstAdded: project.firstAdded?.toISOString() ?? project.createdAt?.toISOString() ?? null,
			updatedAt: new Date().toISOString()
		})
		.returning({ id: schema.projects.id })
		.get();

	return result.id;
}

function replaceCommitHistory(projectId: number, history: Record<string, number>): void {
	db.delete(schema.commitHistory)
		.where(sql`${schema.commitHistory.projectId} = ${projectId}`)
		.run();

	const rows = Object.entries(history).map(([monthKey, commitCount]) => ({
		projectId,
		monthKey,
		commitCount
	}));

	if (rows.length > 0) {
		db.insert(schema.commitHistory).values(rows).run();
	}
}

function replaceTopics(projectId: number, topics: string[]): void {
	db.delete(schema.projectTopics)
		.where(sql`${schema.projectTopics.projectId} = ${projectId}`)
		.run();

	if (topics.length > 0) {
		const rows = topics.map((topic) => ({ projectId, topic }));
		db.insert(schema.projectTopics).values(rows).run();
	}
}

// ── Main seed function ──

async function seed() {
	console.log('=== awwesome database seed ===');
	console.log(`Database: ${DB_PATH}`);
	const startTime = performance.now();

	// 1. Create tables
	console.log('\n1. Creating tables...');
	createTables();
	console.log('   Tables ready.');

	// 2. Create crawl log entry
	const crawlLogResult = db
		.insert(schema.crawlLog)
		.values({ startedAt: new Date().toISOString(), status: 'running' })
		.returning({ id: schema.crawlLog.id })
		.get();
	const crawlId = crawlLogResult.id;

	try {
		// 3. Fetch and parse markdown
		console.log('\n2. Fetching and parsing awesome lists...');
		const markdown = await combineSources(config.urls);
		const { projects: parsedProjects, categories } = extractRepositories(markdown);
		console.log(`   Found ${parsedProjects.length} projects in ${categories.urls.size} categories.`);

		// 4. Insert categories
		console.log('\n3. Inserting categories...');
		const categoryIdMap = new Map<string, number>();
		for (const url of categories.urls) {
			const id = upsertCategoryPath(url, categories.names);
			categoryIdMap.set(url, id);
		}
		console.log(`   Inserted ${categoryIdMap.size} category paths.`);

		// 5. Insert raw projects (before GitHub enrichment)
		console.log('\n4. Inserting raw projects...');
		const projectIdMap = new Map<string, number>();
		let skipped = 0;
		for (const project of parsedProjects) {
			if (!project.primary_url || !project.category) {
				skipped++;
				continue;
			}
			const categoryId = categoryIdMap.get(project.category);
			if (!categoryId) {
				skipped++;
				continue;
			}
			const projectId = upsertProject(project, categoryId);
			projectIdMap.set(project.primary_url, projectId);
		}
		console.log(`   Inserted ${projectIdMap.size} projects (${skipped} skipped).`);

		// 6. Fetch GitHub data
		let enrichedCount = 0;
		if (process.env.TOKEN_GITHUB) {
			console.log('\n5. Fetching GitHub data...');
			const githubData = await fetchAllGithubRepositories(parsedProjects);
			console.log(`   Fetched ${githubData.length} GitHub repos.`);

			// 7. Enrich projects with GitHub data
			console.log('\n6. Enriching projects with GitHub data...');
			for (const project of parsedProjects) {
				if (!project.primary_url) continue;

				const { project: enrichedProject, found } = mapProjectToRepo(githubData, project);
				if (!found) continue;

				const categoryId = categoryIdMap.get(enrichedProject.category!);
				if (!categoryId) continue;

				const projectId = upsertProject(enrichedProject, categoryId);
				enrichedCount++;

				// Store commit history
				if (enrichedProject.commit_history) {
					replaceCommitHistory(projectId, enrichedProject.commit_history);
				}

				// Store topics
				if (enrichedProject.topics && enrichedProject.topics.length > 0) {
					replaceTopics(projectId, enrichedProject.topics);
				}
			}
			console.log(`   Enriched ${enrichedCount} projects.`);
		} else {
			console.log('\n5. Skipping GitHub enrichment (TOKEN_GITHUB not set).');
			console.log('   Set TOKEN_GITHUB environment variable to enrich projects with GitHub data.');
		}

		// 8. Update crawl log
		db.update(schema.crawlLog)
			.set({
				finishedAt: new Date().toISOString(),
				projectsFound: projectIdMap.size,
				projectsEnriched: enrichedCount,
				status: 'completed'
			})
			.where(sql`${schema.crawlLog.id} = ${crawlId}`)
			.run();

		const duration = ((performance.now() - startTime) / 1000).toFixed(1);
		console.log(`\n=== Seed completed in ${duration}s ===`);
		console.log(`   Projects: ${projectIdMap.size}`);
		console.log(`   Enriched: ${enrichedCount}`);
		console.log(`   Categories: ${categoryIdMap.size}`);
	} catch (error) {
		db.update(schema.crawlLog)
			.set({
				finishedAt: new Date().toISOString(),
				status: 'failed'
			})
			.where(sql`${schema.crawlLog.id} = ${crawlId}`)
			.run();
		throw error;
	} finally {
		sqlite.close();
	}
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
