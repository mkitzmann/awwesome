import { getCategoryTree } from '$lib/server/db/queries';

export function GET() {
	const { urls } = getCategoryTree();
	const base = 'https://www.awweso.me';

	const pages = [
		base,
		...Array.from(urls).map((path) => `${base}${path}`)
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
}
