import { TOKEN_GITHUB } from '$env/static/private';
import { getQuery } from './query';
import db from '$lib/selfhosted-db.json';
import type { Project, ProjectCollection, Repository } from '../lib/types/types';

export async function load(): Promise<ProjectCollection> {
	const query = getQuery();
	try {
		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'bearer ' + TOKEN_GITHUB
			},
			body: JSON.stringify({ query })
		});
		const { data }: { data: Repository } = await response.json();

		const projects: ProjectCollection = {};

		db.projects.forEach((project) => {
			const repo = data.search.repos.find((repo) => repo.repo.url === project.source_url)?.repo;

			if (repo) {
				projects[project.source_url] = {
					name: repo?.name ?? project.name,
					description: repo?.description ?? project.description,
					source_url: project.source_url,
					category: project.category,
					demo_url: project.demo_url,
					stars: repo?.stargazers.totalCount
				};
			}
		});
		return projects;
	} catch (e) {
		console.error(e);
		throw e;
	}
}
