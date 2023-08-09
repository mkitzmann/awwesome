<script lang="ts">
	import ChevronRight from './ChevronRight.svelte';

	export let category;
	export let indent = 0;

	export let href = '/' + category.slug;

	let isOpen = false;
	const toggle = () => {
		isOpen = !isOpen;
	};
</script>

<div class="flex items-center justify-between w-full" style="margin-left: {indent}px">
	<a {href} class="truncate max-w-full xl:max-w-full text-left text-sm px-2 py-1 rounded-full"
		>{category.name}</a
	>
	{#if category.children.length > 0}
		<button on:click={toggle}>
			<ChevronRight />
		</button>
	{/if}
</div>
{#if isOpen}
	{#each category.children as category2}
		<svelte:self category={category2} href="{href}/{category2.slug}" indent={indent + 10} />
	{/each}
{/if}
