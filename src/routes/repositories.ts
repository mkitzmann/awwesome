function extractRepositories(markdownText: string) {
	const lines = markdownText.split('\n');
	const result = [];
	let currentCategory = null;

	for (const line of lines) {
		if (line.startsWith('### ')) {
			// Extract the category from the markdown heading
			currentCategory = line.slice(4).trim();
		} else if (line.includes('](https://github.com/')) {
			// Extract the GitHub URL and name
			const nameStartIndex = line.indexOf('[');
			const nameEndIndex = line.indexOf('](');
			const urlStartIndex = line.indexOf('https://github.com/');
			const urlEndIndex = line.indexOf(')');

			const name = line.slice(nameStartIndex + 1, nameEndIndex);
			const url = line.slice(urlStartIndex, urlEndIndex);

			// Add the object to the result array
			if (currentCategory && url) {
				result.push({ name, url, category: currentCategory });
			}
		} else if (line.includes('## List of Licenses')) {
			break;
		}
	}
	return result;
}

export async function getRepositories() {
	const awesomeSelfhostedResponse = await fetch(
		'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md'
	);
	const awesomeSelfhosted = await awesomeSelfhostedResponse.text();
	return extractRepositories(awesomeSelfhosted);
}
