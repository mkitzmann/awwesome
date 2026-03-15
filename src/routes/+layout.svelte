<script lang="ts">
	import '../app.postcss';
	import SvelteSeo from 'svelte-seo';
	import type { Snippet } from 'svelte';
	import { env } from '$env/dynamic/public';

	let { children }: { children: Snippet } = $props();
</script>

{#if env.PUBLIC_ANALYTICS_URL && env.PUBLIC_ANALYTICS_WEBSITE_ID}
	<svelte:head>
		<script
			defer
			src="{env.PUBLIC_ANALYTICS_URL}/script.js"
			data-website-id={env.PUBLIC_ANALYTICS_WEBSITE_ID}
		></script>
	</svelte:head>
{/if}

<SvelteSeo
	title="awwesome selfhosted"
	description="Find the most awesome open-source, self-hostable projects on the web. Original data by the awesome-selfhosted community, licensed under CC-BY-SA 3.0."
	openGraph={{
		title: 'awwesome selfhosted',
		description:
			'Find the most awesome open-source, self-hostable projects on the web. Original data by the awesome-selfhosted community, licensed under CC-BY-SA 3.0.',
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
{@render children()}
