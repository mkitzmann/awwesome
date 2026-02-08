import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const categories = sqliteTable(
	'categories',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		slug: text('slug').notNull(),
		name: text('name').notNull(),
		parentId: integer('parent_id').references((): any => categories.id),
		fullPath: text('full_path').notNull().unique()
	},
	(table) => ({
		parentIdx: index('idx_categories_parent_id').on(table.parentId),
		fullPathIdx: index('idx_categories_full_path').on(table.fullPath)
	})
);

export const projects = sqliteTable(
	'projects',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name'),
		primaryUrl: text('primary_url').unique(),
		sourceUrl: text('source_url'),
		demoUrl: text('demo_url'),
		description: text('description'),
		licenseName: text('license_name'),
		licenseUrl: text('license_url'),
		licenseNickname: text('license_nickname'),
		stack: text('stack'),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id),
		stars: integer('stars'),
		avatarUrl: text('avatar_url'),
		pushedAt: text('pushed_at'),
		createdAt: text('created_at'),
		firstAdded: text('first_added'),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
	},
	(table) => ({
		categoryIdx: index('idx_projects_category_id').on(table.categoryId),
		starsIdx: index('idx_projects_stars').on(table.stars)
	})
);

export const projectCategories = sqliteTable(
	'project_categories',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		projectId: integer('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' })
	},
	(table) => ({
		projectIdx: index('idx_project_categories_project_id').on(table.projectId),
		categoryIdx: index('idx_project_categories_category_id').on(table.categoryId),
		uniquePair: uniqueIndex('idx_project_categories_unique').on(table.projectId, table.categoryId)
	})
);

export const commitHistory = sqliteTable(
	'commit_history',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		projectId: integer('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		monthKey: text('month_key').notNull(),
		commitCount: integer('commit_count').notNull().default(0)
	},
	(table) => ({
		projectIdx: index('idx_commit_history_project_id').on(table.projectId),
		uniqueMonth: uniqueIndex('idx_commit_history_unique').on(table.projectId, table.monthKey)
	})
);

export const crawlLog = sqliteTable('crawl_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	startedAt: text('started_at').notNull(),
	finishedAt: text('finished_at'),
	projectsFound: integer('projects_found').default(0),
	projectsEnriched: integer('projects_enriched').default(0),
	status: text('status').default('running')
});
