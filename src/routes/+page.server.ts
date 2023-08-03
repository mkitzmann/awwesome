import { TOKEN_GITHUB } from '$env/static/private';
import { getQuery } from './query';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const query = getQuery();
	try {
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
	} catch (e) {
		console.error(e);
		throw e;
	}
}
