import { TOKEN_GITHUB } from '$env/static/private';
import { createQuery } from './query';
import type { GithubRepo, Project, ProjectCollection } from '../lib/types/types';
import { getRepositories } from './repositories';
import { fetchRepoInfoFromGithub } from '../lib/fetch-github';

export async function load(): Promise<ProjectCollection> {
	const repos = await getRepositories();

	const chunkSize = 100;
	let data: GithubRepo[] = [];
	for (let i = 0; i < repos.length; i += chunkSize) {
		const chunk = repos.slice(i, i + chunkSize);
		const query = await createQuery(chunk);
		const result = await fetchRepoInfoFromGithub(query);
		data = data.concat(result);
	}

	let projects: Project[] = [];
	repos.forEach((item) => {
		const repo = data.find((repo) => repo.url === item.url);

		const project: Project = {
			name: repo?.name ?? item.name,
			description: repo?.description ?? item.description ?? '',
			source_url: item.url ?? '',
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
