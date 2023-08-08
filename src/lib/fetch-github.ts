import { TOKEN_GITHUB } from '$env/static/private';
import { GithubQueryResult, GithubRepo } from './types/types';

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
			console.log(data.rateLimit);
			return data.search.repos.map((data) => data.repo);
		} else {
			throw new Error(JSON.stringify(response.statusText));
		}
	} catch (e) {
		console.error(e);
		throw e;
	}
};
