import { createQuery } from '../../lib/query';
import type {GithubRepo, ProjectCollection} from '../../lib/types/types';
import { getProjectsFromAwesomeList } from '../../lib/repositories';
import { fetchRepoInfoFromGithub } from '../../lib/fetch-github';
import { dev } from '$app/environment';
import {allCategory} from "../../lib";

async function getProjectsAndCategories(params?) {
	let projects = await getProjectsFromAwesomeList();

	const map = new Map(projects.map((project) => [project.category?.slug, project.category]))
	const categories = [allCategory]
		.concat([...map.values()])
	;

	if (params?.category) {
		projects = projects.filter(project => project.category?.slug === params.category)
	}

	const chunkSize = 100;
	let data: GithubRepo[] = [];
	for (let i = 0; i < projects.length; i += chunkSize) {
		const start = performance.now();

		const chunk = projects.slice(i, i + chunkSize);
		const query = await createQuery(chunk);
		const result = await fetchRepoInfoFromGithub(query);
		data = data.concat(result);
		const end = performance.now();
		console.log(`fetched ${result.length} repository information from Github in ${end - start}ms`);

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

	return { projects: sortedProjects, categories };
}

export async function entries() {
	const result = await getProjectsAndCategories()

	return result.categories.map(category => ({category: category.slug}));
}

export async function load({params}): Promise<ProjectCollection> {
	return await getProjectsAndCategories(params);
}

export const prerender = true;
