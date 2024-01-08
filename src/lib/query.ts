import { appConfig } from '../lib/createConfig';

interface MonthInfo {
	name: string;
	since: string;
	until: string;
}

function getLast12Months(): MonthInfo[] {
	const currentDate = new Date(new Date().setHours(0, 0, 0, 0));
	const months = [];

	for (let i = 0; i < 12; i++) {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth() - i;

		const firstDay = new Date(year, month, 2);
		firstDay.setUTCHours(0, 0, 0, 0);
		const nextMonth = new Date(year, month + 1, 1);
		nextMonth.setUTCHours(0, 0, 0, 0);

		const monthInfo: MonthInfo = {
			name: firstDay.toISOString().slice(0, 7).replace('-', ''),
			since: firstDay.toISOString(),
			until: nextMonth.toISOString()
		};

		months.unshift(monthInfo);
	}

	return months;
}

export async function createQuery(urls: string[]) {
	const searchString = `repo:${urls
		.map((url) => url?.replace('https://github.com/', ''))
		.join(' repo:')}`;
	const months = getLast12Months();
	return `
	query {
	  search(
		type:REPOSITORY,
		query: "${searchString}",
		first: ${appConfig.chunkSize + 10}
	  ) {
		repos: edges {
		  repo: node {
			... on Repository {
					createdAt
          url
          name
          owner {
            avatarUrl
          }
          descriptionHTML
          stargazerCount
					licenseInfo {
            url
            name
            nickname
          }
          pushedAt
					repositoryTopics(first: 10) {
					  edges {
					    node {
					      topic {
					        name
					      }
					    }
					  }
					}
          defaultBranchRef {
            target {
              ... on Commit {
              	${months
									.map(
										(month) =>
											`m${month.name}: history(since: "${month.since}", until: "${month.until}") {\n\ttotalCount\n}`
									)
									.join('\n')}
              }
            }
					}
        }
		  }
		}
	  }
		rateLimit {
			limit
			cost
			remaining
			resetAt
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
// 					defaultBranchRef {
// 						target {
// 						... on Commit {
// 								july: history(since: "2023-07-01T00:00:00", until: "2023-08-01T00:00:00") {
// 									totalCount
// 								}
// 								august: history(since: "2023-08-01T00:00:00", until: "2023-09-01T00:00:00") {
// 									totalCount
// 								}
// 							}
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
// }
