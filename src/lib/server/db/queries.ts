import { eq, like, desc, sql } from 'drizzle-orm';
import { db } from './index';
import { categories, projects, projectCategories, commitHistory } from './schema';
import type {
	Project,
	AllCategories,
	Category,
	CommitCount
} from '../../types/types';

// ── Read queries ──

/**
 * Get projects by category path. Uses the project_categories join table
 * so a project tagged with multiple categories appears in all of them.
 */
export function getProjectsByCategory(categoryPath: string): Project[] {
	const isRoot = !categoryPath || categoryPath === '/';

	// Find projects via the many-to-many project_categories join.
	// For the root page, return all projects with their primary category.
	// For a specific category, find all projects that have a matching category.
	const projectRows = isRoot
		? db
				.select({
					id: projects.id,
					name: projects.name,
					primaryUrl: projects.primaryUrl,
					sourceUrl: projects.sourceUrl,
					demoUrl: projects.demoUrl,
					description: projects.description,
					licenseName: projects.licenseName,
					licenseUrl: projects.licenseUrl,
					licenseNickname: projects.licenseNickname,
					stack: projects.stack,
					stars: projects.stars,
					avatarUrl: projects.avatarUrl,
					pushedAt: projects.pushedAt,
					createdAt: projects.createdAt,
					firstAdded: projects.firstAdded,
					categoryFullPath: categories.fullPath
				})
				.from(projects)
				.innerJoin(categories, eq(projects.categoryId, categories.id))
				.orderBy(desc(projects.stars))
				.all()
		: db
				.select({
					id: projects.id,
					name: projects.name,
					primaryUrl: projects.primaryUrl,
					sourceUrl: projects.sourceUrl,
					demoUrl: projects.demoUrl,
					description: projects.description,
					licenseName: projects.licenseName,
					licenseUrl: projects.licenseUrl,
					licenseNickname: projects.licenseNickname,
					stack: projects.stack,
					stars: projects.stars,
					avatarUrl: projects.avatarUrl,
					pushedAt: projects.pushedAt,
					createdAt: projects.createdAt,
					firstAdded: projects.firstAdded,
					categoryFullPath: categories.fullPath
				})
				.from(projectCategories)
				.innerJoin(projects, eq(projectCategories.projectId, projects.id))
				.innerJoin(categories, eq(projectCategories.categoryId, categories.id))
				.where(like(categories.fullPath, categoryPath + '%'))
				.orderBy(desc(projects.stars))
				.all();

	if (projectRows.length === 0) return [];

	// Deduplicate (a project may match multiple sub-categories)
	const seen = new Set<number>();
	const rows = projectRows.filter((r) => {
		if (seen.has(r.id)) return false;
		seen.add(r.id);
		return true;
	});

	const projectIds = rows.map((r) => r.id);
	const idPlaceholders = sql.join(projectIds.map((id) => sql`${id}`), sql`, `);

	// Batch-load category tag names for each project (shown as topic badges in UI)
	const tagRows = db
		.select({
			projectId: projectCategories.projectId,
			tagName: categories.name
		})
		.from(projectCategories)
		.innerJoin(categories, eq(projectCategories.categoryId, categories.id))
		.where(sql`${projectCategories.projectId} IN (${idPlaceholders})`)
		.all();

	const tagsByProject = new Map<number, string[]>();
	for (const row of tagRows) {
		const list = tagsByProject.get(row.projectId) || [];
		list.push(row.tagName);
		tagsByProject.set(row.projectId, list);
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

	// Assemble into Project[] matching the existing type
	return rows.map((row) => ({
		name: row.name,
		primary_url: row.primaryUrl,
		source_url: row.sourceUrl,
		demo_url: row.demoUrl,
		description: row.description,
		license: row.licenseName
			? {
					name: row.licenseName,
					url: row.licenseUrl ?? undefined,
					nickname: row.licenseNickname ?? undefined
				}
			: undefined,
		stack: row.stack,
		category: row.categoryFullPath,
		stars: row.stars,
		avatar_url: row.avatarUrl,
		topics: tagsByProject.get(row.id) || [],
		commit_history: historyByProject.get(row.id) || {},
		pushedAt: row.pushedAt ? new Date(row.pushedAt) : undefined,
		firstAdded: row.firstAdded ? new Date(row.firstAdded) : undefined,
		createdAt: row.createdAt ? new Date(row.createdAt) : undefined
	}));
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

	const tree = buildCategoryTree(rows);

	categoryTreeCache = { tree, urls, names };
	return categoryTreeCache;
}

export function buildCategoryTree(
	rows: { id: number; slug: string; name: string; parentId: number | null; fullPath: string }[]
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
			children: children.map(buildNode).sort((a, b) => a.slug.localeCompare(b.slug))
		};
		return node;
	}

	return rootRows.map(buildNode).sort((a, b) => a.slug.localeCompare(b.slug));
}
