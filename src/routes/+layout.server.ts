import { getCategoryTree, getPlatformList, getLicenseList } from '$lib/server/db/queries';

export async function load() {
	const categories = getCategoryTree();
	const platforms = getPlatformList();
	const licenses = getLicenseList();
	return { categories, platforms, licenses };
}
