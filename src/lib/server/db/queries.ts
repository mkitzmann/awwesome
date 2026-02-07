import { eq, like, desc, sql } from 'drizzle-orm';
import { db } from './index';
import { categories, projects, projectTopics, commitHistory, crawlLog } from './schema';
import type {
	Project,
	AllCategories,
	Category,
	CommitCount
} from '../../types/types';

// ── Read queries ──

export function getProjectsByCategory(categoryPath: string): Project[] {
	const isRoot = !categoryPath || categoryPath === '/';

	// Get matching projects with their category full_path
	const rows = isRoot
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
				.from(projects)
				.innerJoin(categories, eq(projects.categoryId, categories.id))
				.where(like(categories.fullPath, categoryPath + '%'))
				.orderBy(desc(projects.stars))
				.all();

	if (rows.length === 0) return [];

	// Batch-load topics for all project IDs
	const projectIds = rows.map((r) => r.id);
	const topicRows = db
		.select({ projectId: projectTopics.projectId, topic: projectTopics.topic })
		.from(projectTopics)
		.where(sql`${projectTopics.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`)
		.all();

	const topicsByProject = new Map<number, string[]>();
	for (const row of topicRows) {
		const list = topicsByProject.get(row.projectId) || [];
		list.push(row.topic);
		topicsByProject.set(row.projectId, list);
	}

	// Batch-load commit history for all project IDs
	const historyRows = db
		.select({
			projectId: commitHistory.projectId,
			monthKey: commitHistory.monthKey,
			commitCount: commitHistory.commitCount
		})
		.from(commitHistory)
		.where(sql`${commitHistory.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`)
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
			? { name: row.licenseName, url: row.licenseUrl ?? undefined, nickname: row.licenseNickname ?? undefined }
			: undefined,
		stack: row.stack,
		category: row.categoryFullPath,
		stars: row.stars,
		avatar_url: row.avatarUrl,
		topics: topicsByProject.get(row.id) || [],
		commit_history: historyByProject.get(row.id) || {},
		pushedAt: row.pushedAt ? new Date(row.pushedAt) : undefined,
		firstAdded: row.firstAdded ? new Date(row.firstAdded) : undefined,
		createdAt: row.createdAt ? new Date(row.createdAt) : undefined
	}));
}

export function getCategoryTree(): AllCategories {
	const rows = db.select().from(categories).all();

	const urls = new Set<string>();
	const names: { [key: string]: string } = {};

	for (const row of rows) {
		urls.add(row.fullPath);
		names[row.slug] = row.name;
	}

	// Build hierarchical tree from flat rows
	const tree = buildCategoryTree(rows);

	return { tree, urls, names };
}

function buildCategoryTree(
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
		const node: Category = { slug: row.slug, name: row.name };
		if (children.length > 0) {
			node.children = children
				.map(buildNode)
				.sort((a, b) => a.slug.localeCompare(b.slug));
		}
		return node;
	}

	return rootRows.map(buildNode).sort((a, b) => a.slug.localeCompare(b.slug));
}

// ── Write queries (used by seed script) ──

export function upsertCategoryPath(
	fullPath: string,
	slugToName: Record<string, string>
): number {
	const parts = fullPath.split('/').filter(Boolean); // e.g. ["backups", "incremental"]
	let parentId: number | null = null;
	let currentPath = '';
	let lastId = 0;

	for (const slug of parts) {
		currentPath += '/' + slug;
		const name = slugToName[slug] || slug;

		// Try to find existing
		const existing = db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.fullPath, currentPath))
			.get();

		if (existing) {
			parentId = existing.id;
			lastId = existing.id;
		} else {
			const result: { id: number } = db
				.insert(categories)
				.values({ slug, name, parentId, fullPath: currentPath })
				.returning({ id: categories.id })
				.get();
			parentId = result.id;
			lastId = result.id;
		}
	}

	return lastId;
}

export function upsertProject(
	project: Project,
	categoryId: number
): number {
	const existing = db
		.select({ id: projects.id, firstAdded: projects.firstAdded })
		.from(projects)
		.where(eq(projects.primaryUrl, project.primary_url!))
		.get();

	if (existing) {
		db.update(projects)
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
				firstAdded: existing.firstAdded ?? project.firstAdded?.toISOString() ?? project.createdAt?.toISOString() ?? null,
				updatedAt: new Date().toISOString()
			})
			.where(eq(projects.id, existing.id))
			.run();
		return existing.id;
	}

	const result = db
		.insert(projects)
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
		.returning({ id: projects.id })
		.get();

	return result.id;
}

export function replaceCommitHistory(projectId: number, history: CommitCount): void {
	db.delete(commitHistory).where(eq(commitHistory.projectId, projectId)).run();

	const rows = Object.entries(history).map(([monthKey, commitCount]) => ({
		projectId,
		monthKey,
		commitCount
	}));

	if (rows.length > 0) {
		db.insert(commitHistory).values(rows).run();
	}
}

export function replaceTopics(projectId: number, topics: string[]): void {
	db.delete(projectTopics).where(eq(projectTopics.projectId, projectId)).run();

	if (topics.length > 0) {
		const rows = topics.map((topic) => ({ projectId, topic }));
		db.insert(projectTopics).values(rows).run();
	}
}

export function createCrawlLogEntry(): number {
	const result = db
		.insert(crawlLog)
		.values({ startedAt: new Date().toISOString(), status: 'running' })
		.returning({ id: crawlLog.id })
		.get();
	return result.id;
}

export function completeCrawlLogEntry(
	id: number,
	projectsFound: number,
	projectsEnriched: number,
	status: 'completed' | 'failed' = 'completed'
): void {
	db.update(crawlLog)
		.set({
			finishedAt: new Date().toISOString(),
			projectsFound,
			projectsEnriched,
			status
		})
		.where(eq(crawlLog.id, id))
		.run();
}
