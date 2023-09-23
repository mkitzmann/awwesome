import type { AllCategories, GithubRepo, Project, ProjectCollection } from '$lib/types/types';
import { getAllCategories, getProjectsFromAwesomeList } from '$lib/repositories';
import { fetchAllGithubRepositories } from '$lib/fetch-github';
import { findPreviousProject, mapProjectToRepo, removeTrailingSlashes } from '$lib';
import * as fs from 'fs/promises';
import { writeJsonToFile } from '$lib/files';

let allProjects: Project[] = [];
let allCategories: AllCategories;

async function loadPreviousProjectLog(): Promise<Project[]> {
	let projectLog: Project[] = [];

	try {
		const projectLogFile = await fs.readFile('log/projects.json', 'utf8');
		projectLog = JSON.parse(projectLogFile);
	} catch (e) {
		console.error(e);
	}
	return projectLog;
}

async function updateProjectsAndLogs(data: GithubRepo[]) {
	const notFoundProjects: Project[] = [];
	const newProjects: Project[] = [];
	const projectLog = await loadPreviousProjectLog();

	await Promise.all(
		allProjects.map(async (project) => {
			const { project: mappedProject, found } = mapProjectToRepo(data, project);
			if (!found) {
				notFoundProjects.push(mappedProject);
			}
			if (projectLog.length > 0) {
				const previousProject = findPreviousProject(projectLog, mappedProject);

				if (previousProject) {
					mappedProject.firstAdded = previousProject?.firstAdded
						? new Date(previousProject.firstAdded)
						: new Date();
				} else {
					newProjects.push(mappedProject);
					mappedProject.firstAdded = project.createdAt;
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

export async function loadProjectCollection({
	urls,
	category = ''
}: {
	urls: string[];
	category?: string;
}): Promise<ProjectCollection> {
	const startComplete = performance.now();
	const requestedCategory: string = removeTrailingSlashes(category) ?? '';
	console.log('creating load function, category: ', requestedCategory);

	allProjects = await getProjectsFromAwesomeList(urls);
	allCategories = await getAllCategories(urls);

	let data: GithubRepo[] = [];

	data = await fetchAllGithubRepositories(allProjects);
	await updateProjectsAndLogs(data);

	const filteredProjects = [...allProjects].filter((project) => {
		if (!project.category) {
			return false;
		}
		return project.category.includes(requestedCategory);
	});

	const sortedProjects = filteredProjects.sort((a, b) => (b.stars || 0) - (a.stars || 0));

	const endComplete = performance.now();
	console.log(`processed ${sortedProjects.length} projects in ${endComplete - startComplete}ms`);

	return {
		projects: sortedProjects,
		categories: allCategories
	};
}
