import db from '../selfhosted-db.json';
import { TOKEN_GITHUB } from '$env/static/private';

const searchString =
	'repo:' + db.projects.map((project) => project.source_url.slice(19)).join(' repo:');

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const query = `
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

	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'bearer ' + TOKEN_GITHUB
		},
		body: JSON.stringify({ query })
	});
	const { data } = await response.json();

	return data.search;
}
