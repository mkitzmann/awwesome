import { getRepositories } from './repositories';

/** @type {import('./$types').PageServerLoad} */
export async function getQuery() {
	const repos = await getRepositories();
	const searchString = 'repo:' + repos.map((project) => project.url.slice(19)).join(' repo:');

	return `
	query {
	  search(
		type:REPOSITORY,
		query: "${searchString}",
		last: 400
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
