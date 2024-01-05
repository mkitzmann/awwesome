import type { GithubRepo, Project } from './types/types';

export const allCategory = { name: 'All', slug: '' };

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

export function mapProjectToRepo(
	data: GithubRepo[],
	project: Project
): { project: Project; found: boolean } {
	const repo = data.find(
		(repo) =>
			repo.url.toLowerCase() === project.primary_url?.toLowerCase() ||
			repo.url.toLowerCase() === project.source_url?.toLowerCase()
	);
	if (!repo) {
		return { project, found: false };
	}

	project.stars = repo.stargazerCount ?? undefined;
	project.description = repo.descriptionHTML ?? project.description ?? undefined;
	project.avatar_url = repo.owner?.avatarUrl.slice(0, -4) + '?size=80';
	project.commit_history = Object.entries(repo.defaultBranchRef.target).reduce((prev, entry) => {
		prev[entry[0]] = entry[1].totalCount;
		return prev;
	}, {});
	project.license = repo.licenseInfo;
	project.pushedAt = new Date(repo.pushedAt);
	project.createdAt = new Date(repo.createdAt);
	project.topics = repo?.repositoryTopics.edges.map((edge) => edge.node.topic.name) ?? [];

	return { project, found: true };
}

export function findPreviousProject(data: Project[], project: Project): Project {
	return data.find(
		(repo) => repo.primary_url?.toLowerCase() === project.primary_url?.toLowerCase()
	);
}

export function delay(time) {
	return new Promise((res) => {
		setTimeout(res, time);
	});
}
