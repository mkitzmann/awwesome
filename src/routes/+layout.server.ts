import { getCategoryTree } from '$lib/server/db/queries';

export async function load() {
	const categories = getCategoryTree();
	return { categories };
}
