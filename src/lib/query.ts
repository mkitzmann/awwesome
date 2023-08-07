import type { Project } from './types/types';

export async function createQuery(projects: Project[]) {
	const urls = projects.map((project) => {
		if (project.primary_url?.includes('github.com')) {
			return project.primary_url;
		}
		if (project.source_url?.includes('github.com')) {
			return project.source_url;
		}
		return;
	});
	const searchString = 'repo:' + urls.map((url) => url?.slice(19)).join(' repo:');
	const chunkSize = 100;
	return `
	query {
	  search(
		type:REPOSITORY,
		query: "${searchString}",
		last: ${chunkSize}
	  ) {
		repos: edges {
		  repo: node {
			... on Repository {
			  url
			  description
			  name


			  stargazers {
					totalCount
			  }
			  allIssues: issues {
					totalCount
			  }
			  openIssues: issues(states:OPEN) {
					totalCount
			  }
			}
		  }
		}
	  }
	}
	`;
}
