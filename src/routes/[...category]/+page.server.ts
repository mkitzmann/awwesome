import { createQuery } from '../../lib/query';
import type {
	AllCategories,
	Category,
	GithubRepo,
	Project,
	ProjectCollection
} from '../../lib/types/types';
import { getAllCategories, getProjectsFromAwesomeList } from '../../lib/repositories';
import { fetchRepoInfoFromGithub } from '../../lib/fetch-github';
import {
	chunkSize,
	extractGithubRepoUrls,
	mapProjectToRepo,
	removeTrailingSlashes
} from '../../lib';
import * as fs from 'fs';

export async function entries(): Promise<Array<{ category: string }>> {
	console.log('creating entries function');
	const { urls } = await getAllCategories();
	return [{ category: '' }].concat([...urls].map((url) => ({ category: url.slice(1) })));
}

let allProjects: Project[] = [];
let allCategories: AllCategories;
let loaded = false;

export async function load({ params }): Promise<ProjectCollection> {
	const startComplete = performance.now();
	const requestedCategory: string = removeTrailingSlashes(params.category) ?? '';
	console.log('creating load function, category: ', requestedCategory);
	if (allProjects.length === 0) {
		allProjects = await getProjectsFromAwesomeList();
		allCategories = await getAllCategories();
	}

	let data: GithubRepo[] = [];
	if (!loaded) {
		const githubRepoUrls = extractGithubRepoUrls(allProjects);
		const start = performance.now();
		const promises = [];
		for (let i = 0; i < githubRepoUrls.size; i += chunkSize) {
			const chunk = [...githubRepoUrls].slice(i, i + chunkSize);
			const query = await createQuery(chunk);
			promises.push(fetchRepoInfoFromGithub(query));
		}

		const results = await Promise.all(promises);
		results.forEach((result) => (data = data.concat(result)));

		const end = performance.now();
		console.log(`fetched ${data.length} repositories from Github in ${end - start}ms`);

		const notFoundProjects = [];
		allProjects.map((project) => {
			const { project: mappedProject, found } = mapProjectToRepo(data, project);
			if (!found) {
				notFoundProjects.push(mappedProject);
			}
			return mappedProject;
		});

		fs.writeFile('notfound.json', JSON.stringify(notFoundProjects), (err) => {
			if (err) {
				return console.error(err);
			}
			console.log(
				`${notFoundProjects.length} Projects could not be found on GitHub. List saved to notfound.json.`
			);
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

	const endComplete = performance.now();
	console.log(`processed ${sortedProjects.length} projects in ${endComplete - startComplete}ms`);

	return {
		projects: sortedProjects,
		categories: allCategories
	};
}
