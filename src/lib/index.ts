// import { GithubRepo, Project } from '$lib/types/types';
import { dev } from '$app/environment';
import type { GithubRepo, Project } from './types/types';

export const allCategory = { name: 'All', slug: '' };
export const chunkSize = 40;

export const removeTrailingSlashes = (input?: string | unknown): string => {
	if (!input || typeof input !== 'string') {
		return;
	}
	return input.replace(/\/$/, '');
};

export function extractGithubRepoUrls(projects: Project[]) {
	const githubRepoUrls: Set<string> = new Set();
	[...projects].reduce((prev, project) => {
		let url;
		project.source_url?.includes('github.com') ? (url = project.source_url) : '';
		project.primary_url?.includes('github.com') ? (url = project.primary_url) : '';
		prev.add(removeTrailingSlashes(url));
		return prev;
	}, githubRepoUrls);
	console.log(`Github Repos total: ${githubRepoUrls.size}`);
	return githubRepoUrls;
}

export function mapProjectToRepo(data: GithubRepo[], project: Project) {
	const repo = data.find(
		(repo) =>
			repo.url.toLowerCase() === project.primary_url?.toLowerCase() ||
			repo.url.toLowerCase() === project.source_url?.toLowerCase()
	);
	if (!repo) {
		// We are not fetching all repos in dev so this would just flood the console
		if (!dev) {
			console.error(
				`Project not found: primary_url: ${project.primary_url} source_url: ${project.source_url} `
			);
		}
		return project;
	}

	project.stars = repo.stargazerCount;
	project.description = repo.descriptionHTML ?? project.description;
	project.avatar_url = repo.owner?.avatarUrl;
	project.commit_history = repo.defaultBranchRef.target;
	project.pushedAt = new Date(repo.pushedAt);
	project.topics = repo?.repositoryTopics.edges.map((edge) => edge.node.topic) ?? [];
	return project;
}
