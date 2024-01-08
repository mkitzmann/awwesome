import type { AllCategories, Category, Project } from './types/types';
import slugify from '@sindresorhus/slugify';
import { removeTrailingSlashes } from './index';
import { appConfig } from '../lib/createConfig';

export interface ProjectsAndCategories {
	projects: Project[];
	categories: AllCategories;
}

function extractName(input) {
	const regex = /\[([^\]]+)\]\(/;
	const match = input.match(regex);
	return match ? match[1].trim() : null;
}

function extractPrimaryUrl(input) {
	const regex = /\((https?:\/\/[^)]+)\)/;
	const match = input.match(regex);
	return match ? removeTrailingSlashes(match[1].trim()) : null;
}

function extractDescription(input) {
	const regex = /-\s*\[(?:[^\]]+)\]\([^)]+\)\s*-\s*(.+?)(?:\s*\(|`)/;
	const match = input.match(regex);
	return match ? match[1]?.trim() : undefined;
}

function extractStack(input) {
	const regex = /`([^`]+)`\s*`([^`]+)`$/;
	const match = input.match(regex);
	return match ? match[1].trim() : undefined;
}

function extractLicense(input) {
	const regex = /`([^`]+)`\s*`([^`]+)`$/;
	const match = input.match(regex);
	return match ? match[0].trim() : undefined;
}

function extractSourceUrl(input) {
	const regex = /\[Source Code\]\(([^)]+)/;
	const match = input.match(regex);
	return match ? removeTrailingSlashes(match[1].trim()) : undefined;
}

function extractDemoUrl(input) {
	const regex = /\[Demo\]\(([^)]+)/;
	const match = input.match(regex);
	return match ? match[1].trim() : undefined;
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

/*
 Extract the category from the markdown heading
 */
function extractCategory(line: string) {
	return line.slice(4).trim().split(' - ');
}

function extractRepositories(markdownText: string): ProjectsAndCategories {
	const lines = markdownText.split('\n');
	const projects: Project[] = [];

	let currentCategoryURL = '';
	const allCategoriesObject = {};

	const allCategories: AllCategories = { tree: [], names: {}, urls: new Set() };

	for (const line of lines) {
		if (line.startsWith('### ')) {
			const currentCategoryNames = extractCategory(line);
			if (currentCategoryNames[0] === 'Backup') {
				currentCategoryNames[0] = 'Backups';
			}
			currentCategoryURL = '';

			currentCategoryNames.forEach((categoryName) => {
				allCategories.names[slugify(categoryName)] = categoryName;
				currentCategoryURL = `${currentCategoryURL}/${slugify(categoryName)}`;
				allCategories.urls.add(currentCategoryURL);
			});

			[...currentCategoryNames].reduce(
				(prev, current) => (prev[current] = prev[current] ?? {}),
				allCategoriesObject
			);
			allCategories.tree = transformObjectToArray(allCategoriesObject);
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
			license: extractLicense(line) ? { name: extractLicense(line) } : undefined,
			source_url: extractSourceUrl(line),
			demo_url: extractDemoUrl(line),
			category: currentCategoryURL
		};
		projects.push(project);
	}

	allCategories.tree = allCategories.tree.sort((categoryA, categoryB) =>
		categoryA.slug.localeCompare(categoryB.slug)
	);

	return { projects, categories: allCategories };
}

async function combineSources(urls: string[]): Promise<string> {
	let combinedMarkdown = '';
	for (const item of urls) {
		const response = await fetch(item);
		const markdown = await response.text();
		combinedMarkdown = combinedMarkdown + markdown;
	}
	return combinedMarkdown;
}

export async function getProjectsFromAwesomeList(): Promise<Project[]> {
	const start = performance.now();
	const markdown = await combineSources(appConfig.urls);
	const { projects } = extractRepositories(markdown);
	const end = performance.now();
	console.log(
		`loaded ${projects.length} projects from Awesome Selfhosted and Sysadmin in ${end - start}ms`
	);
	return projects;
}

export async function getAllCategories(): Promise<AllCategories> {
	const markdown = await combineSources(appConfig.urls);
	const { categories } = extractRepositories(markdown);
	return categories;
}
