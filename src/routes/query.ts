import db from '$lib/selfhosted-db.json';

/** @type {import('./$types').PageServerLoad} */
export function getQuery() {
	const searchString =
		'repo:' + db.projects.map((project) => project.source_url.slice(19)).join(' repo:');

	return `
	query {
	  search(
		type:REPOSITORY,
		query: "${searchString}",
		last: 100
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
