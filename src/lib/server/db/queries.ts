import { eq, sql } from 'drizzle-orm';
import { db, sqlite } from './index';
import {
	categories,
	projectCategories,
	commitHistory,
	platforms as platformsTable,
	projectPlatforms
} from './schema';
import type {
	AllCategories,
	Category,
	CommitCount,
	PaginatedResult,
	SortTerm,
	SortOrder
} from '../../types/types';

// ── Paginated query ──

export interface ProjectQuery {
	category?: string;
	search?: string;
	sort?: SortTerm;
	order?: SortOrder;
	limit?: number;
	offset?: number;
	minStars?: number;
	maxStars?: number;
	minCommitsYear?: number;
	platform?: string;
	license?: string;
	addedAfter?: string;
	addedBefore?: string;
	releasedAfter?: string;
}

export function getProjectsPaginated(query: ProjectQuery): PaginatedResult {
	const {
		category = '/',
		search = '',
		sort = 'stars',
		order = 'desc',
		limit = 20,
		offset = 0,
		minStars,
		maxStars,
		minCommitsYear,
		platform,
		license,
		addedAfter,
		addedBefore,
		releasedAfter
	} = query;

	const isRoot = !category || category === '/';

	// Build WHERE conditions and params for raw SQL
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (!isRoot) {
		conditions.push(`p.id IN (
			SELECT DISTINCT pc.project_id
			FROM project_categories pc
			JOIN categories c ON pc.category_id = c.id
			WHERE c.full_path LIKE ?
		)`);
		params.push(category + '%');
	}

	if (search) {
		conditions.push(`(p.name LIKE ? OR p.description LIKE ?)`);
		params.push(`%${search}%`, `%${search}%`);
	}

	if (minStars != null) {
		conditions.push(`p.stars >= ?`);
		params.push(minStars);
	}

	if (maxStars != null) {
		conditions.push(`p.stars <= ?`);
		params.push(maxStars);
	}

	if (minCommitsYear != null) {
		conditions.push(`p.id IN (
			SELECT ch.project_id
			FROM commit_history ch
			GROUP BY ch.project_id
			HAVING SUM(ch.commit_count) >= ?
		)`);
		params.push(minCommitsYear);
	}

	if (platform) {
		conditions.push(`p.id IN (
			SELECT pp.project_id
			FROM project_platforms pp
			JOIN platforms pl ON pp.platform_id = pl.id
			WHERE pl.name = ?
		)`);
		params.push(platform);
	}

	if (license) {
		conditions.push(`(p.license_nickname = ? OR p.license_name = ?)`);
		params.push(license, license);
	}

	if (addedAfter) {
		conditions.push(`p.first_added >= ?`);
		params.push(addedAfter);
	}

	if (addedBefore) {
		conditions.push(`p.first_added <= ?`);
		params.push(addedBefore);
	}

	if (releasedAfter) {
		conditions.push(`p.release_date >= ?`);
		params.push(releasedAfter);
	}

	const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

	// Sort column — commitsYear uses a subquery to sum commit history
	let sortExpression: string;
	if (sort === 'commitsYear') {
		sortExpression = `(SELECT COALESCE(SUM(ch.commit_count), 0) FROM commit_history ch WHERE ch.project_id = p.id)`;
	} else if (sort === 'trending') {
		sortExpression = `COALESCE(
			CASE WHEN (
				SELECT sh.stars FROM star_history sh
				WHERE sh.project_id = p.id
					AND sh.recorded_at <= date('now', '-30 days')
				ORDER BY sh.recorded_at DESC LIMIT 1
			) > 0 THEN
				(p.stars - (
					SELECT sh.stars FROM star_history sh
					WHERE sh.project_id = p.id
						AND sh.recorded_at <= date('now', '-30 days')
					ORDER BY sh.recorded_at DESC LIMIT 1
				)) * 100.0 / (
					SELECT sh.stars FROM star_history sh
					WHERE sh.project_id = p.id
						AND sh.recorded_at <= date('now', '-30 days')
					ORDER BY sh.recorded_at DESC LIMIT 1
				)
			ELSE 0 END
		, 0)`;
	} else if (sort === 'trendingAbsolute') {
		sortExpression = `COALESCE(p.stars - (
			SELECT sh.stars FROM star_history sh
			WHERE sh.project_id = p.id
				AND sh.recorded_at <= date('now', '-30 days')
			ORDER BY sh.recorded_at DESC LIMIT 1
		), 0)`;
	} else if (sort === 'firstAdded') {
		sortExpression = 'p.first_added';
	} else if (sort === 'releaseDate') {
		sortExpression = 'p.release_date';
	} else {
		sortExpression = 'p.stars';
	}
	const sortDir = order === 'asc' ? 'ASC' : 'DESC';
	// Push NULLs to end regardless of sort direction (commitsYear/trending/trendingAbsolute never null due to COALESCE)
	const orderClause =
		sort === 'commitsYear' || sort === 'trending' || sort === 'trendingAbsolute'
			? `ORDER BY ${sortExpression} ${sortDir}`
			: `ORDER BY ${sortExpression} IS NULL, ${sortExpression} ${sortDir}`;

	// Count total
	const countRow = sqlite
		.prepare(`SELECT COUNT(*) as count FROM projects p ${whereClause}`)
		.get(...params) as { count: number };
	const total = countRow?.count ?? 0;

	if (total === 0) return { projects: [], total: 0 };

	// Fetch paginated rows
	const trendingCol = `, COALESCE(
			CASE WHEN (
				SELECT sh.stars FROM star_history sh
				WHERE sh.project_id = p.id
					AND sh.recorded_at <= date('now', '-30 days')
				ORDER BY sh.recorded_at DESC LIMIT 1
			) > 0 THEN
				(p.stars - (
					SELECT sh.stars FROM star_history sh
					WHERE sh.project_id = p.id
						AND sh.recorded_at <= date('now', '-30 days')
					ORDER BY sh.recorded_at DESC LIMIT 1
				)) * 100.0 / (
					SELECT sh.stars FROM star_history sh
					WHERE sh.project_id = p.id
						AND sh.recorded_at <= date('now', '-30 days')
					ORDER BY sh.recorded_at DESC LIMIT 1
				)
			ELSE 0 END
		, 0) as trending_delta,
		COALESCE(p.stars - (
			SELECT sh.stars FROM star_history sh
			WHERE sh.project_id = p.id
				AND sh.recorded_at <= date('now', '-30 days')
			ORDER BY sh.recorded_at DESC LIMIT 1
		), 0) as trending_absolute`;
	const rows = sqlite
		.prepare(
			`SELECT p.id, p.name, p.primary_url, p.source_url, p.demo_url,
				p.description, p.license_name, p.license_url, p.license_nickname,
				p.stars, p.avatar_url, p.pushed_at, p.first_added,
				p.release_version, p.release_date,
				p.archived, cat.full_path as category_full_path${trendingCol}
			FROM projects p
			JOIN categories cat ON p.category_id = cat.id
			${whereClause}
			${orderClause}
			LIMIT ? OFFSET ?`
		)
		.all(...params, limit, offset) as {
		id: number;
		name: string | null;
		primary_url: string | null;
		source_url: string | null;
		demo_url: string | null;
		description: string | null;
		license_name: string | null;
		license_url: string | null;
		license_nickname: string | null;
		stars: number | null;
		avatar_url: string | null;
		pushed_at: string | null;
		first_added: string | null;
		release_version: string | null;
		release_date: string | null;
		archived: number | null;
		category_full_path: string;
		trending_delta?: number | null;
		trending_absolute?: number | null;
	}[];

	if (rows.length === 0) return { projects: [], total };

	const projectIds = rows.map((r) => r.id);
	const idPlaceholders = sql.join(
		projectIds.map((id) => sql`${id}`),
		sql`, `
	);

	// Batch-load tags
	const tagRows = db
		.select({
			projectId: projectCategories.projectId,
			tagName: categories.name,
			fullPath: categories.fullPath
		})
		.from(projectCategories)
		.innerJoin(categories, eq(projectCategories.categoryId, categories.id))
		.where(sql`${projectCategories.projectId} IN (${idPlaceholders})`)
		.all();

	const tagsByProject = new Map<number, { name: string; path: string }[]>();
	for (const row of tagRows) {
		const list = tagsByProject.get(row.projectId) || [];
		list.push({ name: row.tagName, path: row.fullPath });
		tagsByProject.set(row.projectId, list);
	}

	// Batch-load platforms
	const platformRows = db
		.select({
			projectId: projectPlatforms.projectId,
			name: platformsTable.name
		})
		.from(projectPlatforms)
		.innerJoin(platformsTable, eq(projectPlatforms.platformId, platformsTable.id))
		.where(sql`${projectPlatforms.projectId} IN (${idPlaceholders})`)
		.all();

	const platformsByProject = new Map<number, string[]>();
	for (const row of platformRows) {
		const list = platformsByProject.get(row.projectId) || [];
		list.push(row.name);
		platformsByProject.set(row.projectId, list);
	}

	// Batch-load commit history
	const historyRows = db
		.select({
			projectId: commitHistory.projectId,
			monthKey: commitHistory.monthKey,
			commitCount: commitHistory.commitCount
		})
		.from(commitHistory)
		.where(sql`${commitHistory.projectId} IN (${idPlaceholders})`)
		.all();

	const historyByProject = new Map<number, CommitCount>();
	for (const row of historyRows) {
		const hist = historyByProject.get(row.projectId) || {};
		hist[row.monthKey] = row.commitCount;
		historyByProject.set(row.projectId, hist);
	}

	return {
		total,
		projects: rows.map((row) => ({
			name: row.name,
			primary_url: row.primary_url,
			source_url: row.source_url,
			demo_url: row.demo_url,
			description: row.description,
			license: row.license_name
				? {
						name: row.license_name,
						url: row.license_url ?? undefined,
						nickname: row.license_nickname ?? undefined
					}
				: undefined,
			platforms: platformsByProject.get(row.id) || [],
			category: row.category_full_path,
			stars: row.stars,
			avatar_url: row.avatar_url,
			topics: tagsByProject.get(row.id) || [],
			commit_history: historyByProject.get(row.id) || {},
			trendingDelta: row.trending_delta ?? undefined,
			trendingAbsolute: row.trending_absolute ?? undefined,
			releaseVersion: row.release_version ?? undefined,
			releaseDate: row.release_date ?? undefined,
			pushedAt: row.pushed_at ? new Date(row.pushed_at) : undefined,
			firstAdded: row.first_added ? new Date(row.first_added) : undefined,
			archived: !!row.archived
		}))
	};
}

let categoryTreeCache: AllCategories | null = null;

export function getCategoryTree(): AllCategories {
	if (categoryTreeCache) return categoryTreeCache;

	const rows = db.select().from(categories).all();

	const urls = new Set<string>();
	const names: { [key: string]: string } = {};

	for (const row of rows) {
		urls.add(row.fullPath);
		names[row.slug] = row.name;
	}

	// Count projects per category (including subcategories via full_path prefix match)
	const countRows = sqlite
		.prepare(
			`
			SELECT c.id, COUNT(DISTINCT pc.project_id) as count
			FROM categories c
			JOIN project_categories pc ON pc.category_id IN (
				SELECT c2.id FROM categories c2 WHERE c2.full_path LIKE c.full_path || '%'
			)
			GROUP BY c.id
		`
		)
		.all() as { id: number; count: number }[];
	const countMap = new Map(countRows.map((r) => [r.id, r.count]));

	const tree = buildCategoryTree(rows, countMap);

	categoryTreeCache = { tree, urls, names };
	return categoryTreeCache;
}

export function buildCategoryTree(
	rows: { id: number; slug: string; name: string; parentId: number | null; fullPath: string }[],
	countMap?: Map<number, number>
): Category[] {
	const rootRows = rows.filter((r) => r.parentId === null);
	const childMap = new Map<number, typeof rows>();

	for (const row of rows) {
		if (row.parentId !== null) {
			const children = childMap.get(row.parentId) || [];
			children.push(row);
			childMap.set(row.parentId, children);
		}
	}

	function buildNode(row: (typeof rows)[0]): Category {
		const children = childMap.get(row.id) || [];
		const node: Category = {
			slug: row.slug,
			name: row.name,
			count: countMap?.get(row.id) ?? 0,
			children: children.map(buildNode).sort((a, b) => a.slug.localeCompare(b.slug))
		};
		return node;
	}

	return rootRows.map(buildNode).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function invalidateCaches(): void {
	categoryTreeCache = null;
	platformListCache = null;
	licenseListCache = null;
}

let licenseListCache: string[] | null = null;

export function getLicenseList(): string[] {
	if (licenseListCache) return licenseListCache;
	const rows = sqlite
		.prepare(
			`SELECT DISTINCT COALESCE(license_nickname, license_name) as label FROM projects WHERE license_name IS NOT NULL ORDER BY label`
		)
		.all() as { label: string }[];
	licenseListCache = rows.map((r) => r.label);
	return licenseListCache;
}

let platformListCache: string[] | null = null;

export function getPlatformList(): string[] {
	if (platformListCache) return platformListCache;
	const rows = db.select({ name: platformsTable.name }).from(platformsTable).all();
	platformListCache = rows.map((r) => r.name).sort();
	return platformListCache;
}
