import { GithubQueryResult, GithubRepo, Project } from './types/types';
import { TOKEN_GITHUB } from '$env/static/private';
import { chunkSize, extractGithubRepoUrls } from './index';
import { createQuery } from './query';

export async function fetchAllGithubRepositories(allProjects: Project[]) {
	const githubRepoUrls = extractGithubRepoUrls(allProjects);
	const start = performance.now();
	const urls = [...githubRepoUrls];
	const promises = [];

	for (let i = 0; i < urls.length; i += chunkSize) {
		const chunk = urls.slice(i, i + chunkSize);
		const query = await createQuery(chunk);
		promises.push(fetchRepoInfoFromGithub(query));
	}

	const results = await Promise.all(promises);
	const data: GithubRepo[] = results.flat();

	const end = performance.now();
	console.log(`fetched ${data.length} repositories from Github in ${end - start}ms`);

	return data;
}

async function request(query) {
	return fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'bearer ' + TOKEN_GITHUB
		},
		body: JSON.stringify({ query })
	});
}

export const fetchRepoInfoFromGithub = async (query: string): Promise<GithubRepo[]> => {
	try {
		let response = await request(query);

		if (response.status === 502) {
			const limit = 4; // Github returns random 502 errors, so we try 4 times which usually fixes the problem
			for (let i = 0; i < limit; i++) {
				console.log(
					`received 502 error, request again ${i} of ${limit}`,
					JSON.stringify(response.headers)
				);
				response = await request(query);
				if (response.ok) {
					break;
				}
			}
		}

		if (response.ok) {
			const { data }: { data: GithubQueryResult } = await response.json();
			console.log(
				`Repos: ${data.search.repos.length}, Github API cost: ${data.rateLimit.cost}, remaining: ${data.rateLimit.remaining}`
			);
			return data.search.repos.map((data) => data.repo);
		}

		console.log(query);
		throw new Error(JSON.stringify(response.statusText));
	} catch (e) {
		console.error(e);
		throw e;
	}
};
