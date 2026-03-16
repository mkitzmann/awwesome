import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// ── In-memory test database ──

const testSqlite = new Database(':memory:');
testSqlite.pragma('foreign_keys = ON');
const testDb = drizzle(testSqlite, { schema });

vi.mock('./index', () => ({
	db: testDb,
	sqlite: testSqlite
}));

// Import after mock so it picks up the test database
const { getProjectsPaginated, getPlatformList } = await import('./queries');

// ── Schema setup ──

function createTables() {
	testSqlite.exec(`
		CREATE TABLE categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL,
			name TEXT NOT NULL,
			parent_id INTEGER REFERENCES categories(id),
			full_path TEXT NOT NULL UNIQUE
		);

		CREATE TABLE projects (
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
			release_version TEXT,
			release_date TEXT,
			archived INTEGER DEFAULT 0,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE project_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE
		);
		CREATE UNIQUE INDEX idx_pc_unique ON project_categories(project_id, category_id);

		CREATE TABLE commit_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			month_key TEXT NOT NULL,
			commit_count INTEGER NOT NULL DEFAULT 0
		);
		CREATE UNIQUE INDEX idx_ch_unique ON commit_history(project_id, month_key);

		CREATE TABLE platforms (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		);

		CREATE TABLE project_platforms (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE
		);
		CREATE UNIQUE INDEX idx_pp_unique ON project_platforms(project_id, platform_id);

		CREATE TABLE star_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			recorded_at TEXT NOT NULL,
			stars INTEGER NOT NULL
		);
		CREATE UNIQUE INDEX idx_sh_unique ON star_history(project_id, recorded_at);
	`);
}

// ── Seed data ──

function seed() {
	// Categories
	testSqlite.exec(`
		INSERT INTO categories (id, slug, name, parent_id, full_path) VALUES
			(1, 'communication', 'Communication', NULL, '/communication'),
			(2, 'email',         'Email',         1,    '/communication/email'),
			(3, 'media',         'Media',         NULL, '/media'),
			(4, 'streaming',     'Streaming',     3,    '/media/streaming');
	`);

	// Projects
	testSqlite.exec(`
		INSERT INTO projects (id, name, primary_url, source_url, demo_url, description,
			license_name, license_url, license_nickname, stack, category_id, stars,
			avatar_url, pushed_at, first_added, archived) VALUES
			(1, 'Nextcloud',  'https://nextcloud.com',  'https://github.com/nextcloud',  NULL,
			 'Cloud platform for files and collaboration', 'AGPL-3.0', 'https://license.example/agpl', 'AGPL',
			 'PHP', 1, 20000, 'https://avatars.example/nc.png', '2024-02-01', '2023-01-01', 0),
			(2, 'Roundcube',  'https://roundcube.net',   'https://github.com/roundcube',  'https://demo.roundcube.net',
			 'Free and open source webmail client', 'GPL-3.0', NULL, NULL,
			 'PHP', 2, 5000, NULL, '2024-01-15', '2023-06-15', 0),
			(3, 'Jellyfin',   'https://jellyfin.org',    'https://github.com/jellyfin',   NULL,
			 'Media streaming system', 'GPL-2.0', NULL, NULL,
			 'C#', 4, 25000, NULL, '2024-02-10', '2023-03-01', 0),
			(4, 'OldProject', 'https://old.example.com', NULL, NULL,
			 'Old archived project nobody uses', NULL, NULL, NULL,
			 NULL, 3, 100, NULL, NULL, '2022-01-01', 1),
			(5, 'NullStars',  'https://null.example.com', NULL, NULL,
			 'A project with null stars and no first_added', NULL, NULL, NULL,
			 NULL, 1, NULL, NULL, NULL, NULL, 0);
	`);

	// Junction table (many-to-many)
	testSqlite.exec(`
		INSERT INTO project_categories (project_id, category_id) VALUES
			(1, 1),
			(2, 2),
			(2, 1),
			(3, 4),
			(3, 3),
			(4, 3),
			(5, 1);
	`);

	// Commit history
	testSqlite.exec(`
		INSERT INTO commit_history (project_id, month_key, commit_count) VALUES
			(1, '2024-01', 50),
			(1, '2024-02', 30),
			(3, '2024-01', 100);
	`);

	// Platforms
	testSqlite.exec(`
		INSERT INTO platforms (id, name) VALUES
			(1, 'PHP'),
			(2, 'C#'),
			(3, 'Docker');
	`);

	// Project-platform associations
	testSqlite.exec(`
		INSERT INTO project_platforms (project_id, platform_id) VALUES
			(1, 1),
			(1, 3),
			(2, 1),
			(3, 2),
			(3, 3);
	`);
}

beforeAll(() => {
	createTables();
	seed();
});

afterAll(() => {
	testSqlite.close();
});

// ── Tests ──

describe('getProjectsPaginated', () => {
	// ── Defaults ──

	it('returns all projects with default params', () => {
		const result = getProjectsPaginated({});
		expect(result.total).toBe(5);
		expect(result.projects).toHaveLength(5);
	});

	// ── Pagination ──

	it('respects limit', () => {
		const result = getProjectsPaginated({ limit: 2 });
		expect(result.projects).toHaveLength(2);
		expect(result.total).toBe(5);
	});

	it('respects offset', () => {
		const all = getProjectsPaginated({});
		const page2 = getProjectsPaginated({ limit: 2, offset: 2 });
		expect(page2.projects).toHaveLength(2);
		expect(page2.projects[0].name).toBe(all.projects[2].name);
	});

	it('returns empty projects when offset exceeds total', () => {
		const result = getProjectsPaginated({ offset: 100 });
		expect(result.projects).toHaveLength(0);
		expect(result.total).toBe(5);
	});

	// ── Sorting ──

	it('sorts by stars descending by default', () => {
		const result = getProjectsPaginated({});
		const names = result.projects.map((p) => p.name);
		expect(names).toEqual(['Jellyfin', 'Nextcloud', 'Roundcube', 'OldProject', 'NullStars']);
	});

	it('sorts by stars ascending with NULLs last', () => {
		const result = getProjectsPaginated({ sort: 'stars', order: 'asc' });
		const names = result.projects.map((p) => p.name);
		expect(names).toEqual(['OldProject', 'Roundcube', 'Nextcloud', 'Jellyfin', 'NullStars']);
	});

	it('sorts by firstAdded descending with NULLs last', () => {
		const result = getProjectsPaginated({ sort: 'firstAdded', order: 'desc' });
		const names = result.projects.map((p) => p.name);
		expect(names).toEqual(['Roundcube', 'Jellyfin', 'Nextcloud', 'OldProject', 'NullStars']);
	});

	it('sorts by firstAdded ascending with NULLs last', () => {
		const result = getProjectsPaginated({ sort: 'firstAdded', order: 'asc' });
		const names = result.projects.map((p) => p.name);
		expect(names).toEqual(['OldProject', 'Nextcloud', 'Jellyfin', 'Roundcube', 'NullStars']);
	});

	// ── Search ──

	it('searches by project name (case-insensitive LIKE)', () => {
		const result = getProjectsPaginated({ search: 'jellyfin' });
		expect(result.total).toBe(1);
		expect(result.projects[0].name).toBe('Jellyfin');
	});

	it('searches by description', () => {
		const result = getProjectsPaginated({ search: 'webmail' });
		expect(result.total).toBe(1);
		expect(result.projects[0].name).toBe('Roundcube');
	});

	it('returns empty results for non-matching search', () => {
		const result = getProjectsPaginated({ search: 'nonexistent' });
		expect(result.total).toBe(0);
		expect(result.projects).toHaveLength(0);
	});

	// ── Category filtering ──

	it('returns all projects for root category', () => {
		const result = getProjectsPaginated({ category: '/' });
		expect(result.total).toBe(5);
	});

	it('filters by /communication (includes subcategory projects)', () => {
		const result = getProjectsPaginated({ category: '/communication' });
		const names = result.projects.map((p) => p.name);
		expect(result.total).toBe(3);
		expect(names).toContain('Nextcloud');
		expect(names).toContain('Roundcube');
		expect(names).toContain('NullStars');
	});

	it('filters by /communication/email', () => {
		const result = getProjectsPaginated({ category: '/communication/email' });
		expect(result.total).toBe(1);
		expect(result.projects[0].name).toBe('Roundcube');
	});

	it('filters by /media (includes subcategory projects)', () => {
		const result = getProjectsPaginated({ category: '/media' });
		const names = result.projects.map((p) => p.name);
		expect(result.total).toBe(2);
		expect(names).toContain('Jellyfin');
		expect(names).toContain('OldProject');
	});

	// ── Combined filters ──

	it('combines category + search', () => {
		const result = getProjectsPaginated({ category: '/communication', search: 'cloud' });
		expect(result.total).toBe(1);
		expect(result.projects[0].name).toBe('Nextcloud');
	});

	it('combines category + search with no match', () => {
		const result = getProjectsPaginated({ category: '/media', search: 'cloud' });
		expect(result.total).toBe(0);
	});

	// ── Field mapping ──

	it('maps all project fields correctly', () => {
		const result = getProjectsPaginated({ search: 'Nextcloud' });
		const p = result.projects[0];

		expect(p.name).toBe('Nextcloud');
		expect(p.primary_url).toBe('https://nextcloud.com');
		expect(p.source_url).toBe('https://github.com/nextcloud');
		expect(p.demo_url).toBeNull();
		expect(p.description).toBe('Cloud platform for files and collaboration');
		expect(p.license).toEqual({
			name: 'AGPL-3.0',
			url: 'https://license.example/agpl',
			nickname: 'AGPL'
		});
		expect(p.platforms).toContain('PHP');
		expect(p.category).toBe('/communication');
		expect(p.stars).toBe(20000);
		expect(p.avatar_url).toBe('https://avatars.example/nc.png');
		expect(p.archived).toBe(false);
		expect(p.firstAdded).toEqual(new Date('2023-01-01'));
	});

	it('omits license when license_name is null', () => {
		const result = getProjectsPaginated({ search: 'OldProject' });
		expect(result.projects[0].license).toBeUndefined();
	});

	it('maps archived flag correctly', () => {
		const result = getProjectsPaginated({ search: 'OldProject' });
		expect(result.projects[0].archived).toBe(true);
	});

	// ── Related data ──

	it('loads topics (tags) from junction table', () => {
		const result = getProjectsPaginated({ search: 'Roundcube' });
		const topics = result.projects[0].topics;
		expect(topics).toHaveLength(2);
		const names = topics?.map((t) => t.name);
		expect(names).toContain('Communication');
		expect(names).toContain('Email');
	});

	it('loads commit history', () => {
		const result = getProjectsPaginated({ search: 'Nextcloud' });
		const history = result.projects[0].commit_history;
		expect(history).toEqual({ '2024-01': 50, '2024-02': 30 });
	});

	it('returns empty commit history when none exists', () => {
		const result = getProjectsPaginated({ search: 'OldProject' });
		expect(result.projects[0].commit_history).toEqual({});
	});

	// ── Star range filter ──

	it('filters by minStars', () => {
		const result = getProjectsPaginated({ minStars: 10000 });
		expect(result.total).toBe(2);
		const names = result.projects.map((p) => p.name);
		expect(names).toContain('Jellyfin');
		expect(names).toContain('Nextcloud');
	});

	it('filters by maxStars', () => {
		const result = getProjectsPaginated({ maxStars: 5000 });
		expect(result.total).toBe(2);
		const names = result.projects.map((p) => p.name);
		expect(names).toContain('Roundcube');
		expect(names).toContain('OldProject');
	});

	it('filters by minStars + maxStars range', () => {
		const result = getProjectsPaginated({ minStars: 1000, maxStars: 21000 });
		expect(result.total).toBe(2);
		const names = result.projects.map((p) => p.name);
		expect(names).toContain('Nextcloud');
		expect(names).toContain('Roundcube');
	});

	// ── Commit activity filter ──

	it('filters by minCommitsYear', () => {
		// Nextcloud: 50+30=80, Jellyfin: 100, others: 0
		const result = getProjectsPaginated({ minCommitsYear: 90 });
		expect(result.total).toBe(1);
		expect(result.projects[0].name).toBe('Jellyfin');
	});

	it('minCommitsYear=1 excludes projects with no commits', () => {
		const result = getProjectsPaginated({ minCommitsYear: 1 });
		expect(result.total).toBe(2);
		const names = result.projects.map((p) => p.name);
		expect(names).toContain('Nextcloud');
		expect(names).toContain('Jellyfin');
	});

	// ── Sort by commitsYear ──

	it('sorts by commitsYear descending', () => {
		const result = getProjectsPaginated({ sort: 'commitsYear', order: 'desc' });
		const names = result.projects.map((p) => p.name);
		// Jellyfin: 100, Nextcloud: 80, others: 0
		expect(names[0]).toBe('Jellyfin');
		expect(names[1]).toBe('Nextcloud');
	});

	it('sorts by commitsYear ascending', () => {
		const result = getProjectsPaginated({ sort: 'commitsYear', order: 'asc' });
		const names = result.projects.map((p) => p.name);
		// 0-commit projects first, then Nextcloud (80), then Jellyfin (100)
		expect(names[names.length - 1]).toBe('Jellyfin');
		expect(names[names.length - 2]).toBe('Nextcloud');
	});

	// ── Platform filter ──

	it('filters by platform', () => {
		const result = getProjectsPaginated({ platform: 'PHP' });
		expect(result.total).toBe(2);
		const names = result.projects.map((p) => p.name);
		expect(names).toContain('Nextcloud');
		expect(names).toContain('Roundcube');
	});

	it('filters by platform with exact match', () => {
		const result = getProjectsPaginated({ platform: 'C#' });
		expect(result.total).toBe(1);
		expect(result.projects[0].name).toBe('Jellyfin');
	});

	it('returns empty for non-existent platform', () => {
		const result = getProjectsPaginated({ platform: 'Rust' });
		expect(result.total).toBe(0);
	});

	// ── Date added filter ──

	it('filters by addedAfter', () => {
		const result = getProjectsPaginated({ addedAfter: '2023-03-01' });
		expect(result.total).toBe(2);
		const names = result.projects.map((p) => p.name);
		expect(names).toContain('Jellyfin');
		expect(names).toContain('Roundcube');
	});

	it('filters by addedBefore', () => {
		const result = getProjectsPaginated({ addedBefore: '2023-01-01' });
		expect(result.total).toBe(2);
		const names = result.projects.map((p) => p.name);
		expect(names).toContain('Nextcloud');
		expect(names).toContain('OldProject');
	});

	it('filters by addedAfter + addedBefore range', () => {
		const result = getProjectsPaginated({ addedAfter: '2023-02-01', addedBefore: '2023-04-01' });
		expect(result.total).toBe(1);
		expect(result.projects[0].name).toBe('Jellyfin');
	});

	// ── Combined new filters ──

	it('combines minStars + platform', () => {
		const result = getProjectsPaginated({ minStars: 10000, platform: 'Docker' });
		expect(result.total).toBe(2);
		const names = result.projects.map((p) => p.name);
		expect(names).toContain('Nextcloud');
		expect(names).toContain('Jellyfin');
	});

	it('combines minCommitsYear + category', () => {
		const result = getProjectsPaginated({ minCommitsYear: 50, category: '/communication' });
		expect(result.total).toBe(1);
		expect(result.projects[0].name).toBe('Nextcloud');
	});
});

describe('getPlatformList', () => {
	it('returns sorted platform names', () => {
		const platforms = getPlatformList();
		expect(platforms).toEqual(['C#', 'Docker', 'PHP']);
	});
});
