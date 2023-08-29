import fs from 'fs';

export async function writeJsonToFile({ filename, data }: { filename: string; data: unknown }) {
	fs.writeFile(filename, JSON.stringify(data), (err) => {
		if (err) {
			return console.error(err);
		}
	});
}
