import type { Project } from './types/types';

export async function createQuery(projects: Project[]) {
	const urls = projects
		.map((project) => {
			if (project.primary_url?.includes('github.com')) {
				return project.primary_url;
			}
			if (project.source_url?.includes('github.com')) {
				return project.source_url;
			}
			return;
		})
		.filter((a) => a);

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
          name
          owner {
            avatarUrl
          }
          descriptionHTML
          stargazerCount
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 1) {
                  edges {
                    node {
                      authoredDate
                      message
                    }
                  }
                }
              }
            }
					}
        }
		  }
		}
	  }
	}
	`;
}

// query {
// 	search(
// 		type:REPOSITORY,
// 		query: "${searchString}",
// 		last: ${chunkSize}
// ) {
// 		repos: edges {
// 			repo: node {
// 			... on Repository {
// 					url
// 					name
// 					owner {
// 						avatarUrl
// 					}
// 					repositoryTopics(last: 10) {
// 					  edges {
// 					    node {
// 					      topic {
// 					        name
// 					      }
// 					    }
// 					  }
// 					}
// 					languages {
// 					  edges {
// 					    node {
// 					      name
// 					    }
// 					  }
// 					}
// 					archivedAt
// 					collaborators {
// 					  totalCount
// 					}
// 					descriptionHTML
// 					latestRelease {
// 						createdAt
// 					}
// 					licenseInfo {
// 						name
// 					}
// 					openGraphImageUrl
// 					stargazerCount
// 					updatedAt
// 					openIssues: issues(states:OPEN) {
// 						totalCount
// 					}
// 				}
// 			}
// 		}
// 	}
// }
