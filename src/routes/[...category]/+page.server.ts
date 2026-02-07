import type { ProjectCollection } from '../../lib/types/types';
import { getProjectsByCategory } from '$lib/server/db/queries';
import { removeTrailingSlashes } from '$lib';

export async function load({ params, parent }): Promise<ProjectCollection> {
	const { categories } = await parent();
	const requestedCategory = '/' + (removeTrailingSlashes(params.category) ?? '');

	const isRoot = requestedCategory === '/';
	const projects = getProjectsByCategory(isRoot ? '/' : requestedCategory);

	return {
		projects,
		categories
	};
}
