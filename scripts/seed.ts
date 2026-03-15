/**
 * Seed script: Reads structured YAML data from the awesome-selfhosted-data repo,
 * and stores everything in the SQLite database.
 *
 * Usage: npm run seed
 * No GitHub API token required — the data repo already includes stars, commit history, etc.
 *
 * Data source: https://github.com/awesome-selfhosted/awesome-selfhosted-data
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import * as schema from '../src/lib/server/db/schema.js';
import { parseFirstAddedOutput, tagFilenameToPath } from './seedUtils.js';

// ── Config ──

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = process.env.DATABASE_URL || path.resolve(PROJECT_ROOT, 'data/awwesome.db');
const DATA_REPO_URL = 'https://github.com/awesome-selfhosted/awesome-selfhosted-data.git';
const DATA_REPO_DIR = path.resolve(PROJECT_ROOT, 'data/awesome-selfhosted-data');

// ── Setup database ──

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });

// ── Types for YAML data ──

interface SoftwareYaml {
	name: string;
	description: string;
	website_url?: string;
	source_code_url?: string;
	demo_url?: string;
	licenses?: string[];
	platforms?: string[];
	tags?: string[];
	stargazers_count?: number;
	updated_at?: string;
	archived?: boolean;
	depends_3rdparty?: boolean;
	current_release?: {
		tag?: string;
		published_at?: string;
	};
	commit_history?: Record<string, number>;
}

interface TagYaml {
	name: string;
	description?: string;
	related_tags?: string[];
	external_links?: { title: string; url: string }[];
	redirect?: string;
}

// ── Git operations ──

function cloneOrPullDataRepo(): void {
	if (fs.existsSync(path.join(DATA_REPO_DIR, '.git'))) {
		console.log('   Updating existing data repo...');
		execSync('git pull --ff-only', { cwd: DATA_REPO_DIR, stdio: 'pipe' });
	} else {
		console.log('   Cloning data repo with full history (first run may take a minute)...');
		fs.mkdirSync(path.dirname(DATA_REPO_DIR), { recursive: true });
		execSync(`git clone ${DATA_REPO_URL} "${DATA_REPO_DIR}"`, { stdio: 'pipe' });
	}
}

/**
 * Batch-load firstAdded dates for all software/*.yml files in a single git log pass.
 * Uses --reverse --diff-filter=A to list files in chronological order of when they were added.
 * For each file, the first occurrence gives us the first-added date.
 */
function buildFirstAddedMap(): Map<string, string> {
	try {
		const output = execSync(
			'git log --reverse --diff-filter=A --format=%aI --name-only -- software/',
			{ cwd: DATA_REPO_DIR, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] }
		);
		return parseFirstAddedOutput(output);
	} catch (err) {
		console.warn('   Warning: could not read git history for firstAdded dates:', err);
	}
	return new Map();
}

// ── YAML reading ──

function readYamlFile<T>(filePath: string): T | null {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		return yaml.load(content) as T;
	} catch (err) {
		console.warn(`   Warning: failed to read ${filePath}: ${err}`);
		return null;
	}
}

function readAllSoftware(): { filename: string; data: SoftwareYaml }[] {
	const softwareDir = path.join(DATA_REPO_DIR, 'software');
	const files = fs.readdirSync(softwareDir).filter((f) => f.endsWith('.yml'));
	const results: { filename: string; data: SoftwareYaml }[] = [];

	for (const file of files) {
		const data = readYamlFile<SoftwareYaml>(path.join(softwareDir, file));
		if (data && data.name) {
			results.push({ filename: file, data });
		}
	}

	return results;
}

function readAllTags(): Map<string, TagYaml> {
	const tagsDir = path.join(DATA_REPO_DIR, 'tags');
	const files = fs.readdirSync(tagsDir).filter((f) => f.endsWith('.yml'));
	const tags = new Map<string, TagYaml>();

	for (const file of files) {
		const data = readYamlFile<TagYaml>(path.join(tagsDir, file));
		if (data && data.name) {
			tags.set(data.name, data);
		}
	}

	return tags;
}

// ── Category/tag mapping ──
// Tag filenames encode hierarchy with "---" separators.
// e.g. "communication---email---complete-solutions.yml" → /communication/email/complete-solutions
// Simple tags like "dns.yml" → /dns

// Build a tag name → full path map by reading filenames directly
function buildTagPathMap(): Map<string, string> {
	const tagsDir = path.join(DATA_REPO_DIR, 'tags');
	const files = fs.readdirSync(tagsDir).filter((f) => f.endsWith('.yml'));
	const map = new Map<string, string>();

	for (const file of files) {
		const data = readYamlFile<TagYaml>(path.join(tagsDir, file));
		if (!data || !data.name) continue;

		const fullPath = tagFilenameToPath(file);
		map.set(data.name, fullPath);
	}

	return map;
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
			archived INTEGER DEFAULT 0,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
		CREATE INDEX IF NOT EXISTS idx_projects_stars ON projects(stars);

		CREATE TABLE IF NOT EXISTS project_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_project_categories_project_id ON project_categories(project_id);
		CREATE INDEX IF NOT EXISTS idx_project_categories_category_id ON project_categories(category_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_project_categories_unique ON project_categories(project_id, category_id);

		CREATE TABLE IF NOT EXISTS commit_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			month_key TEXT NOT NULL,
			commit_count INTEGER NOT NULL DEFAULT 0
		);
		CREATE INDEX IF NOT EXISTS idx_commit_history_project_id ON commit_history(project_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_commit_history_unique ON commit_history(project_id, month_key);

		CREATE TABLE IF NOT EXISTS platforms (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		);

		CREATE TABLE IF NOT EXISTS project_platforms (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_project_platforms_project_id ON project_platforms(project_id);
		CREATE INDEX IF NOT EXISTS idx_project_platforms_platform_id ON project_platforms(platform_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_project_platforms_unique ON project_platforms(project_id, platform_id);

		CREATE TABLE IF NOT EXISTS star_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			recorded_at TEXT NOT NULL,
			stars INTEGER NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_star_history_project_id ON star_history(project_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_star_history_unique ON star_history(project_id, recorded_at);

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
				.get() as { id: number };
			parentId = result.id;
			lastId = result.id;
		}
	}

	return lastId;
}

function upsertProject(
	data: SoftwareYaml,
	categoryId: number,
	firstAdded: string | null,
	archived: boolean
): number {
	// Use website_url as primary, falling back to source_code_url
	const primaryUrl = data.website_url || data.source_code_url || null;

	if (!primaryUrl) return -1;

	const existing = db
		.select({ id: schema.projects.id, firstAdded: schema.projects.firstAdded })
		.from(schema.projects)
		.where(sql`${schema.projects.primaryUrl} = ${primaryUrl}`)
		.get();

	const values = {
		name: data.name,
		sourceUrl: data.source_code_url ?? null,
		demoUrl: data.demo_url ?? null,
		description: data.description ?? null,
		licenseName: data.licenses?.[0] ?? null,
		licenseUrl: null as string | null,
		licenseNickname: null as string | null,
		stack: data.platforms?.join(', ') ?? null,
		categoryId,
		stars: data.stargazers_count ?? null,
		avatarUrl: null as string | null,
		pushedAt: null as string | null,
		createdAt: null as string | null,
		archived,
		updatedAt: data.updated_at ?? new Date().toISOString()
	};

	if (existing) {
		db.update(schema.projects)
			.set({
				...values,
				firstAdded: existing.firstAdded ?? firstAdded
			})
			.where(sql`${schema.projects.id} = ${existing.id}`)
			.run();
		return existing.id;
	}

	const result = db
		.insert(schema.projects)
		.values({
			primaryUrl,
			...values,
			firstAdded
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

function recordStarSnapshot(projectId: number, stars: number | null): void {
	if (stars == null) return;
	const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
	sqlite
		.prepare(
			`INSERT INTO star_history (project_id, recorded_at, stars)
			 VALUES (?, ?, ?)
			 ON CONFLICT(project_id, recorded_at) DO UPDATE SET stars = excluded.stars`
		)
		.run(projectId, today, stars);
}

const platformIdCache = new Map<string, number>();

function getOrCreatePlatformId(name: string): number {
	const cached = platformIdCache.get(name);
	if (cached) return cached;

	const existing = sqlite
		.prepare(`SELECT id FROM platforms WHERE name = ?`)
		.get(name) as { id: number } | undefined;

	if (existing) {
		platformIdCache.set(name, existing.id);
		return existing.id;
	}

	const result = sqlite
		.prepare(`INSERT INTO platforms (name) VALUES (?) RETURNING id`)
		.get(name) as { id: number };
	platformIdCache.set(name, result.id);
	return result.id;
}

function replaceProjectPlatforms(projectId: number, platformNames: string[]): void {
	sqlite.prepare(`DELETE FROM project_platforms WHERE project_id = ?`).run(projectId);

	const insert = sqlite.prepare(
		`INSERT OR IGNORE INTO project_platforms (project_id, platform_id) VALUES (?, ?)`
	);
	for (const name of platformNames) {
		const platformId = getOrCreatePlatformId(name);
		insert.run(projectId, platformId);
	}
}

function replaceProjectCategories(
	projectId: number,
	tagNames: string[],
	categoryIdMap: Map<string, number>
): void {
	db.delete(schema.projectCategories)
		.where(sql`${schema.projectCategories.projectId} = ${projectId}`)
		.run();

	const rows = tagNames
		.map((tag) => ({ projectId, categoryId: categoryIdMap.get(tag)! }))
		.filter((row) => row.categoryId != null);

	if (rows.length > 0) {
		db.insert(schema.projectCategories).values(rows).run();
	}
}

// ── Main seed function ──

async function seed() {
	console.log('=== awwesome database seed (YAML data source) ===');
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
		// 3. Clone or update the data repo
		console.log('\n2. Fetching awesome-selfhosted-data repo...');
		cloneOrPullDataRepo();
		console.log('   Data repo ready.');

		// 4. Read tags and build category structure
		console.log('\n3. Reading tags and building categories...');
		const tagPathMap = buildTagPathMap();
		const tagDefinitions = readAllTags();

		// Build slug→name mapping from tag paths
		const slugToName: Record<string, string> = {};
		for (const [tagName, fullPath] of tagPathMap) {
			const parts = fullPath.split('/').filter(Boolean);
			// The last slug in the path corresponds to this tag's name
			if (parts.length > 0) {
				slugToName[parts[parts.length - 1]] = tagName;
			}
			// For parent parts derived from filename segments, use the segment as-is if no better name
			for (const part of parts.slice(0, -1)) {
				if (!slugToName[part]) {
					// Try to find a tag whose path matches this parent
					for (const [name, fp] of tagPathMap) {
						if (fp === '/' + part) {
							slugToName[part] = name;
							break;
						}
					}
					if (!slugToName[part]) {
						slugToName[part] = part; // fallback to slug itself
					}
				}
			}
		}

		// Insert all category paths
		const categoryIdMap = new Map<string, number>();
		for (const [tagName, fullPath] of tagPathMap) {
			const tagDef = tagDefinitions.get(tagName);
			// Skip redirect tags (they don't hold software directly)
			if (tagDef?.redirect) continue;

			const id = upsertCategoryPath(fullPath, slugToName);
			categoryIdMap.set(tagName, id);
		}
		console.log(`   Inserted ${categoryIdMap.size} categories from ${tagDefinitions.size} tags.`);

		// 5. Read all software YAML files
		console.log('\n4. Reading software YAML files...');
		const softwareEntries = readAllSoftware();
		console.log(`   Found ${softwareEntries.length} software entries.`);

		// 5b. Batch-load firstAdded dates from git history
		console.log('\n   Loading firstAdded dates from git history...');
		const firstAddedMap = buildFirstAddedMap();
		console.log(`   Found firstAdded dates for ${firstAddedMap.size} files.`);

		// 6. Insert projects (wrapped in transaction for 10-50x SQLite speedup)
		console.log('\n5. Inserting projects...');
		let inserted = 0;
		let skipped = 0;
		let withHistory = 0;

		const insertAll = sqlite.transaction(() => {
			for (const { filename, data } of softwareEntries) {
				// Get the primary tag (first tag) for category assignment
				const primaryTag = data.tags?.[0];
				if (!primaryTag) {
					skipped++;
					continue;
				}

				const categoryId = categoryIdMap.get(primaryTag);
				if (!categoryId) {
					// Tag might be a redirect or unknown
					skipped++;
					continue;
				}

				// Get firstAdded date from pre-built map
				const firstAdded = firstAddedMap.get(`software/${filename}`) ?? null;

				const projectId = upsertProject(data, categoryId, firstAdded, !!data.archived);
				if (projectId === -1) {
					skipped++;
					continue;
				}
				inserted++;

				// Record star snapshot for historical tracking
				recordStarSnapshot(projectId, data.stargazers_count ?? null);

				// Insert platforms (many-to-many)
				if (data.platforms && data.platforms.length > 0) {
					replaceProjectPlatforms(projectId, data.platforms);
				}

				// Insert commit history
				if (data.commit_history && Object.keys(data.commit_history).length > 0) {
					replaceCommitHistory(projectId, data.commit_history);
					withHistory++;
				}

				// Insert all tags as project_categories (many-to-many)
				if (data.tags && data.tags.length > 0) {
					replaceProjectCategories(projectId, data.tags, categoryIdMap);
				}
			}
		});
		insertAll();
		console.log(`   Inserted ${inserted} projects (${skipped} skipped, ${withHistory} with commit history).`);

		// 7. Update crawl log
		db.update(schema.crawlLog)
			.set({
				finishedAt: new Date().toISOString(),
				projectsFound: inserted,
				projectsEnriched: withHistory,
				status: 'completed'
			})
			.where(sql`${schema.crawlLog.id} = ${crawlId}`)
			.run();

		const duration = ((performance.now() - startTime) / 1000).toFixed(1);
		console.log(`\n=== Seed completed in ${duration}s ===`);
		console.log(`   Projects: ${inserted}`);
		console.log(`   With commit history: ${withHistory}`);
		console.log(`   Categories: ${categoryIdMap.size}`);
		console.log(`   Skipped: ${skipped}`);
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
