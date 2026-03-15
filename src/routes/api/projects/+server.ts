import { json } from '@sveltejs/kit';
import { getProjectsPaginated } from '$lib/server/db/queries';
import type { SortTerm, SortOrder } from '$lib/types/types';

function intParam(url: URL, name: string): number | undefined {
	const val = url.searchParams.get(name);
	if (val == null) return undefined;
	const n = parseInt(val, 10);
	return Number.isFinite(n) ? n : undefined;
}

export function GET({ url }) {
	const category = url.searchParams.get('category') || '/';
	const search = url.searchParams.get('search') || '';
	const VALID_SORTS: SortTerm[] = ['stars', 'commitsYear', 'firstAdded'];
	const VALID_ORDERS: SortOrder[] = ['asc', 'desc'];
	const sort: SortTerm = VALID_SORTS.includes(url.searchParams.get('sort') as SortTerm)
		? (url.searchParams.get('sort') as SortTerm)
		: 'stars';
	const order: SortOrder = VALID_ORDERS.includes(url.searchParams.get('order') as SortOrder)
		? (url.searchParams.get('order') as SortOrder)
		: 'desc';
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

	const minStars = intParam(url, 'minStars');
	const maxStars = intParam(url, 'maxStars');
	const minCommitsYear = intParam(url, 'minCommitsYear');
	const platform = url.searchParams.get('platform') || undefined;
	const addedAfter = url.searchParams.get('addedAfter') || undefined;
	const addedBefore = url.searchParams.get('addedBefore') || undefined;

	const result = getProjectsPaginated({
		category, search, sort, order, limit, offset,
		minStars, maxStars, minCommitsYear, platform, addedAfter, addedBefore
	});

	return json(result);
}
