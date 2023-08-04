import { TOKEN_GITHUB } from '$env/static/private';
import { getQuery } from './query';
import type { Project, ProjectCollection, Repository } from '../lib/types/types';
import { getRepositories } from './repositories';

export async function load(): Promise<ProjectCollection> {
	const query = await getQuery();
	try {
		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'bearer ' + TOKEN_GITHUB
			},
			body: JSON.stringify({ query })
		});

		if (response.ok) {
			const { data }: { data: Repository } = await response.json();
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
			console.log(projects);

			return { projects };
		} else {
			throw new Error();
		}
	} catch (e) {
		console.error(e);
		throw e;
	}
}
