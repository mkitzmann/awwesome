import { TOKEN_GITHUB } from '$env/static/private';
import { GithubQueryResult, GithubRepo } from './types/types';

export const fetchRepoInfoFromGithub = async (query: string): Promise<GithubRepo[]> => {
	try {
		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'bearer ' + TOKEN_GITHUB
			},
			body: JSON.stringify({ query })
		});

		if (response.ok) {
			const { data }: { data: GithubQueryResult } = await response.json();
			return data.search.repos.map((data) => data.repo);
		} else {
			throw new Error();
		}
	} catch (e) {
		console.error(e);
		throw e;
	}
};
