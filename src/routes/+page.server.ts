import { AWWESOME_SOURCES } from '$env/static/private';
// import { loadProjects } from '../lib/load';
// import { getProjectsFromAwesomeList } from '../lib/repositories';
import type { Collection, Sources } from '../lib/types/types';
import { getAllCategories, getProjectsFromAwesomeList } from '../lib/repositories';

export async function entries(): Promise<Array<{ category: string }>> {
	console.log('creating entries function');
	const sources = getSources();
	const urls = [];
	for (const [name, url] of Object.entries(sources)) {
		const categories = await getAllCategories(url);
		urls.concat(
			[{ collection: name, category: '' }].concat(
				[...categories.urls].map((url) => ({ collection: name, category: url.slice(1) }))
			)
		);
	}

	return urls;
}

function getSources(): Sources {
	return JSON.parse(AWWESOME_SOURCES);
	// 	?? {
	// 	'Awesome Selfhosted':
	// 		'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md',
	// 	'Awesome Sysadmin':
	// 		'https://raw.githubusercontent.com/awesome-foss/awesome-sysadmin/master/README.md'
	// };
}

export async function load() {
	const sources = getSources();
	const collections: Collection[] = [];

	for (const [name, url] of Object.entries(sources)) {
		collections.push({
			name: name,
			projectCount: (await getProjectsFromAwesomeList([url])).length
		});
	}

	return { collections };
}
