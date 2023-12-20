<script>
	import '../app.postcss';
	import SvelteSeo from 'svelte-seo';
</script>

<SvelteSeo
	title="awwesome selfhosted"
	description="Find the most awesome open-source, self-hostable projects on the web. Original data by the awesome-selfhosted community, licensed under CC-BY-SA 3.0."
	openGraph={{
		title: 'awwesome selfhosted',
		description:
			'Find the most awesome open-source, self-hostable projects on the web. Original data by the awesome-selfhosted community, licensed under CC-BY-SA 3.0.',
		image: 'https://www.awweso.me/awwesome_og.png',
		url: 'https://www.awweso.me',
		type: 'website',
		images: [
			{
				url: 'https://www.awweso.me/awwesome_og.png',
				width: 1200,
				height: 630,
				alt: 'awwesome selfhosted'
			}
		],
		site_name: 'awwesome selfhosted'
	}}
	twitter={{
		card: 'summary_large_image',
		title: 'awwesome selfhosted',
		description:
			'Find the most awesome open-source, self-hostable projects on the web. Original data by the awesome-selfhosted community, licensed under CC-BY-SA 3.0.',
		image: 'https://www.awweso.me/awwesome_og.png'
	}}
/>
<slot />
