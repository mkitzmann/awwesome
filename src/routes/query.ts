export async function createQuery(repos) {
	const searchString = 'repo:' + repos.map((project) => project.url.slice(19)).join(' repo:');

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
