import type { AllCategories, Category, Project } from './types/types';
import slugify from '@sindresorhus/slugify';
function extractName(input) {
	const regex = /\[([^\]]+)\]\(/;
	const match = input.match(regex);
	return match ? match[1].trim() : null;
}

function extractPrimaryUrl(input) {
	const regex = /\((https?:\/\/[^\)]+)\)/;
	const match = input.match(regex);
	return match ? match[1].trim() : null;
}

function extractDescription(input) {
	const regex = /-\s*\[(?:[^\]]+)\]\([^)]+\)\s*-\s*(.+?)(?:\s*\(|`)/;
	const match = input.match(regex);
	return match ? match[1]?.trim() : null;
}

function extractStack(input) {
	const regex = /`([^`]+)`\s*`([^`]+)`$/;
	const match = input.match(regex);
	return match ? match[1].trim() : null;
}

function extractLicense(input) {
	const regex = /`([^`]+)`$/;
	const match = input.match(regex);
	return match ? match[1].trim() : null;
}

function extractSourceUrl(input) {
	const regex = /\[Source Code\]\(([^\)]+)/;
	const match = input.match(regex);
	return match ? match[1].trim() : null;
}

function extractDemoUrl(input) {
	const regex = /\[Demo\]\(([^\)]+)/;
	const match = input.match(regex);
	return match ? match[1].trim() : null;
}

function transformObjectToArray(obj): Category[] {
	const array = [];

	for (const key in obj) {
		const entry = { name: key, slug: slugify(key), children: [] };
		if (Object.keys(obj[key]).length > 0) {
			entry.children = transformObjectToArray(obj[key]);
		}
		array.push(entry);
	}

	return array;
}

export interface ProjectsAndCategories {
	projects: Project[];
	categories: AllCategories;
}

function extractRepositories(markdownText: string): ProjectsAndCategories {
	const lines = markdownText.split('\n');
	const projects: Project[] = [];

	let currentCategoryURL: string;
	const allCategories: AllCategories = { tree: [], names: {}, urls: new Set() };

	const allCategoriesObject = {};
	for (const line of lines) {
		if (line.includes('## List of Licenses')) {
			break;
		}
		if (line.startsWith('### ')) {
			// Extract the category from the markdown heading
			currentCategoryURL = '';
			const currentCategoryNames = line.slice(4).trim().split(' - ');
			currentCategoryNames.forEach((categoryName) => {
				allCategories.names[slugify(categoryName)] = categoryName;
				currentCategoryURL = `${currentCategoryURL}/${slugify(categoryName)}`;
			});

			[...currentCategoryNames].reduce(
				(prev, current) => (prev[current] = prev[current] ?? {}),
				allCategoriesObject
			);
			allCategories.tree = transformObjectToArray(allCategoriesObject);
			allCategories.urls.add(currentCategoryURL);
			continue;
		}
		if (!line.startsWith('- [')) {
			continue;
		}
		if (!extractPrimaryUrl(line)) {
			continue;
		}

		const project: Project = {
			name: extractName(line),
			primary_url: extractPrimaryUrl(line),
			description: extractDescription(line),
			stack: extractStack(line),
			license: extractLicense(line),
			source_url: extractSourceUrl(line),
			demo_url: extractDemoUrl(line),
			category: currentCategoryURL
		};
		projects.push(project);
	}
	return { projects, categories: allCategories };
}

export async function getProjectsFromAwesomeList(): Promise<Project[]> {
	const start = performance.now();
	const awesomeSelfhostedResponse = await fetch(
		'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md'
	);
	const awesomeSelfhosted = await awesomeSelfhostedResponse.text();
	const { projects } = extractRepositories(awesomeSelfhosted);
	const end = performance.now();
	console.log(`loaded ${projects.length} projects from Awesome Selfhosted in ${end - start}ms`);
	return projects;
}

export async function getAllCategories(): Promise<AllCategories> {
	const awesomeSelfhostedResponse = await fetch(
		'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md'
	);
	const awesomeSelfhosted = await awesomeSelfhostedResponse.text();
	const { categories } = extractRepositories(awesomeSelfhosted);
	return categories;
}
