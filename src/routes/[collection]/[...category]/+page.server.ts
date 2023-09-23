import type { ProjectCollection } from '$lib/types/types';
import { getAllCategories } from '$lib/repositories';
import { loadProjectCollection } from '../../../lib/load';
import type { Sources } from '../../../lib/types/types';
import { AWWESOME_SOURCES } from '$env/static/private';
import slugify from '@sindresorhus/slugify';

export async function load({
	params
}: {
	params: { collection: string; category?: string };
}): Promise<ProjectCollection> {
	const sources: Sources = JSON.parse(AWWESOME_SOURCES);
	const collectionName = Object.keys(sources).find((name) => slugify(name) === params.collection);
	const collection = sources[collectionName];
	console.log(collection);
	return loadProjectCollection({ urls: [collection], category: params.category });
}
