import { getCategoryTree, getPlatformList } from '$lib/server/db/queries';

export async function load() {
	const categories = getCategoryTree();
	const platforms = getPlatformList();
	return { categories, platforms };
}
