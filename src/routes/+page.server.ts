import { createQuery } from '../lib/query';
import type { GithubRepo, ProjectCollection } from '../lib/types/types';
import { getProjectsFromAwesomeList } from '../lib/repositories';
import { fetchRepoInfoFromGithub } from '../lib/fetch-github';
import { dev } from '$app/environment';

export async function load(): Promise<ProjectCollection> {
	const projects = await getProjectsFromAwesomeList();

	const chunkSize = 100;
	let data: GithubRepo[] = [];
	for (let i = 0; i < projects.length; i += chunkSize) {
		const chunk = projects.slice(i, i + chunkSize);
		const query = await createQuery(chunk);
		const result = await fetchRepoInfoFromGithub(query);
		data = data.concat(result);

		if (dev) {
			break; // in development its faster to only do one fetch
		}
	}

	projects.map((project) => {
		const repo = data.find(
			(repo) => repo.url === project.primary_url || repo.url === project.source_url
		);
		if (!repo) {
			return project;
		}

		project.stars = repo.stargazerCount;
		project.description = repo.descriptionHTML ?? project.description;
		project.avatar_url = repo.owner?.avatarUrl;
		const lastCommit = repo.defaultBranchRef?.target?.history?.edges?.[0].node?.authoredDate;
		lastCommit ? (project.last_commit = new Date(lastCommit)) : null;
		return project;
	});

	const sortedProjects = projects.sort((a, b) => {
		const starsA = a.stars || 0;
		const starsB = b.stars || 0;
		return starsB - starsA;
	});

	return { projects: sortedProjects };
}
