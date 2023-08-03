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
			const projects: ProjectCollection = {};
			(await getRepositories()).forEach((project) => {
				const repo = data.search.repos.find((repo) => repo.repo.url === project.url)?.repo;

				if (repo) {
					projects[project.url] = {
						name: repo?.name ?? project.name,
						description: repo?.description ?? project.description,
						source_url: project.url,
						category: project.category,
						demo_url: project.demo_url,
						stars: repo?.stargazers.totalCount
					};
				}
			});
			return projects;
		} else {
			throw new Error();
		}
	} catch (e) {
		console.error(e);
		throw e;
	}
}
