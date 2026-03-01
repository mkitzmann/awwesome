import { json } from '@sveltejs/kit';
import { getProjectsPaginated } from '$lib/server/db/queries';
import type { SortTerm, SortOrder } from '$lib/types/types';

export function GET({ url }) {
	const category = url.searchParams.get('category') || '/';
	const search = url.searchParams.get('search') || '';
	const sort = (url.searchParams.get('sort') || 'stars') as SortTerm;
	const order = (url.searchParams.get('order') || 'desc') as SortOrder;
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

	const result = getProjectsPaginated({ category, search, sort, order, limit, offset });

	return json(result);
}
