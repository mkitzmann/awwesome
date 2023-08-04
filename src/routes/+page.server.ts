import { TOKEN_GITHUB } from '$env/static/private';
import { createQuery } from './query';
import type { Project, ProjectCollection, GithubQueryResult } from '../lib/types/types';
import { getRepositories } from './repositories';
import { fetchRepoInfoFromGithub } from '../lib/fetch-github';

export async function load(): Promise<ProjectCollection> {
	const repos = await getRepositories();

	// const chunkSize = 10;
	// for (let i = 0; i < array.length; i += chunkSize) {
	// 	const chunk = array.slice(i, i + chunkSize);
	// 	// do whatever
	const query = await createQuery(repos);
	const data = await fetchRepoInfoFromGithub(query);
	// }
	let projects: Project[] = [];
	(await getRepositories()).forEach((item) => {
		const repo = data.search.repos.find((repo) => repo.repo.url === item.url)?.repo;

		const project: Project = {
			name: repo?.name ?? item.name,
			description: repo?.description ?? item.description ?? '',
			source_url: item.url,
			category: item.category,
			demo_url: item.demo_url,
			stars: repo?.stargazers.totalCount
		};
		projects.push(project);
	});

	projects = projects.sort((a, b) => {
		const starsA = a.stars || 0;
		const starsB = b.stars || 0;
		return starsB - starsA;
	});

	return { projects };
}
