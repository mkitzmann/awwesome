import { createQuery } from '../../lib/query';
import type { AllCategories, GithubRepo, Project, ProjectCollection } from '../../lib/types/types';
import { getAllCategories, getProjectsFromAwesomeList } from '../../lib/repositories';
import { fetchRepoInfoFromGithub } from '../../lib/fetch-github';
import {
	chunkSize,
	extractGithubRepoUrls,
	findPreviousProject,
	mapProjectToRepo,
	removeTrailingSlashes
} from '../../lib';
import * as fs from 'fs/promises';
import { writeJsonToFile } from '../../lib/files';

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
		const newProjects = [];
		await Promise.all(
			allProjects.map(async (project) => {
				const { project: mappedProject, found } = mapProjectToRepo(data, project);
				if (!found) {
					notFoundProjects.push(mappedProject);
				}
				const projectLogFile = await fs.readFile('log/projects.json', 'utf8');
				if (projectLogFile) {
					const projectLog: Project[] = JSON.parse(projectLogFile);

					const previousProject = findPreviousProject(projectLog, mappedProject);

					if (previousProject?.firstAdded) {
						mappedProject.firstAdded = new Date(previousProject.firstAdded);
					} else {
						newProjects.push(mappedProject);
					}
				}

				return mappedProject;
			})
		);
		console.log(`${newProjects.length} new Projects found`);

		await writeJsonToFile({ filename: 'log/projects.json', data: allProjects });
		console.log(`${allProjects.length} total Projects. List saved to log/projects.json.`);

		await writeJsonToFile({ filename: 'log/notfound.json', data: notFoundProjects });
		console.log(
			`${notFoundProjects.length} Projects could not be found on GitHub. List saved to log/notfound.json.`
		);

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
