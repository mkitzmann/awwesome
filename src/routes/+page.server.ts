import db from '../selfhosted-db.json';
import { GITHUB_TOKEN } from '$env/static/private';

const searchString =
	'repo:' + db.projects.map((project) => project.source_url.slice(19)).join(' repo:');
console.log(searchString);

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
			Authorization: 'bearer ' + GITHUB_TOKEN
		},
		body: JSON.stringify({ query })
	});
	const { data } = await response.json();

	console.log(query);
	return data.search;
}
