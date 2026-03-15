<script lang="ts">
	import '../app.postcss';
	import type { Snippet } from 'svelte';
	import { env } from '$env/dynamic/public';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	{#if env.PUBLIC_ANALYTICS_URL && env.PUBLIC_ANALYTICS_WEBSITE_ID}
		<script
			defer
			src={env.PUBLIC_ANALYTICS_URL}
			data-website-id={env.PUBLIC_ANALYTICS_WEBSITE_ID}
		></script>
	{/if}
</svelte:head>

{@render children()}
