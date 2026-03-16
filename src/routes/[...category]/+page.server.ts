import type { ProjectCollection, SortTerm } from '../../lib/types/types';
import { getProjectsPaginated } from '$lib/server/db/queries';
import { removeTrailingSlashes } from '$lib';
import { SORT_SLUGS, sortSlugToTerm } from '$lib/sort';

export async function load({ params, parent }): Promise<ProjectCollection> {
	const { categories, platforms, licenses } = await parent();
	const rawPath = removeTrailingSlashes(params.category) ?? '';
	const segments = rawPath ? rawPath.split('/') : [];

	let sort: SortTerm = 'stars';
	const lastSegment = segments[segments.length - 1];
	if (lastSegment && SORT_SLUGS.has(lastSegment)) {
		sort = sortSlugToTerm(lastSegment)!;
		segments.pop();
	}

	const categoryPath = '/' + segments.join('/');
	const category = categoryPath === '/' ? '/' : categoryPath;
	const { projects, total } = getProjectsPaginated({ category, limit: 50, offset: 0, sort });

	return {
		projects,
		total,
		categories,
		platforms,
		licenses,
		sort
	};
}
