import type { ProjectCollection } from '../../lib/types/types';
import { getProjectsPaginated } from '$lib/server/db/queries';
import { removeTrailingSlashes } from '$lib';

export async function load({ params, parent }): Promise<ProjectCollection> {
	const { categories, platforms } = await parent();
	const requestedCategory = '/' + (removeTrailingSlashes(params.category) ?? '');

	const category = requestedCategory === '/' ? '/' : requestedCategory;
	const { projects, total } = getProjectsPaginated({ category, limit: 20, offset: 0 });

	return {
		projects,
		total,
		categories,
		platforms
	};
}
