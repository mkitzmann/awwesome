import { createQuery } from '../../lib/query';
import type { GithubRepo, Project, ProjectCollection } from '../../lib/types/types';
import { getAllCategories, getProjectsFromAwesomeList } from '../../lib/repositories';
import { fetchRepoInfoFromGithub } from '../../lib/fetch-github';
import { dev } from '$app/environment';
import { chunkSize, removeTrailingSlashes } from '../../lib';

export async function entries(): Promise<Array<{ category: string }>> {
	console.log('creating entries function');
	const { urls } = await getAllCategories();
	return [{ category: '' }].concat([...urls].map((url) => ({ category: url.slice(1) })));
}

let allProjects: Project[] = [];
let loaded = false;

export async function load({ params }): Promise<ProjectCollection> {
	const requestedCategory: string = removeTrailingSlashes(params.category) ?? '';
	console.log('creating load function, category: ', requestedCategory);
	if (allProjects.length === 0) {
		allProjects = await getProjectsFromAwesomeList();
	}

	let data: GithubRepo[] = [];
	if (!loaded) {
		for (let i = 0; i < allProjects.length; i += chunkSize) {
			const start = performance.now();

			const chunk = allProjects.slice(i, i + chunkSize);
			const query = await createQuery(chunk);
			const result = await fetchRepoInfoFromGithub(query);
			data = data.concat(result);
			const end = performance.now();
			console.log(
				`fetched ${result.length} repository information from Github in ${end - start}ms`
			);

			if (dev) {
				break; // in development its faster to only do one fetch
			}
		}

		allProjects.map((project) => {
			const repo = data.find(
				(repo) => repo.url === project.primary_url || repo.url === project.source_url
			);
			if (!repo) {
				return project;
			}

			project.stars = repo.stargazerCount;
			project.description = repo.descriptionHTML ?? project.description;
			project.avatar_url = repo.owner?.avatarUrl;
			project.commit_history = repo.defaultBranchRef.target;
			return project;
		});
		loaded = true;
	}

	let filteredProjects: Project[] = allProjects;
	if (requestedCategory !== '') {
		filteredProjects = filteredProjects.filter((project) => {
			if (!project.category) {
				return false;
			}
			return project.category.includes(requestedCategory);
		});
	}

	const sortedProjects = filteredProjects.sort((a, b) => {
		const starsA = a.stars || 0;
		const starsB = b.stars || 0;
		return starsB - starsA;
	});

	return { projects: sortedProjects, categories: await getAllCategories() };
}

export const prerender = true;
