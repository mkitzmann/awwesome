<script lang="ts">
	import '../app.postcss';
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

{@render children()}
