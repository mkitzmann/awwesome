import type { Project } from './types/types';
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

function extractRepositories(markdownText: string): Project[] {
	const lines = markdownText.split('\n');
	const projects: Project[] = [];

	let currentCategory = null;
	for (const line of lines) {
		if (line.includes('## List of Licenses')) {
			break;
		}
		if (line.startsWith('### ')) {
			// Extract the category from the markdown heading
			currentCategory = line.slice(4).trim();
			continue;
		}
		if (!line.startsWith('- [')) {
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
			category: currentCategory
		};
		projects.push(project);
	}
	return projects;
}

export async function getProjectsFromAwesomeList() {
	const start = performance.now();
	const awesomeSelfhostedResponse = await fetch(
		'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md'
	);
	const awesomeSelfhosted = await awesomeSelfhostedResponse.text();
	const repos = extractRepositories(awesomeSelfhosted);
	const end = performance.now();
	console.log(`loaded ${repos.length} projects from Awesome Selfhosted in ${end - start}ms`);
	return repos;
}
