<script lang="ts">
	import ChevronRight from './ChevronRight.svelte';
		import {beforeUpdate} from "svelte";

	export let category;
	export let selectedCategory;
	export let indent = 0;

	export let href = '/' + category.slug;

	let isOpen = false;
	const toggle = () => {
		isOpen = !isOpen;
	};

	$: isActive = selectedCategory === href.slice(1)
	beforeUpdate(() => selectedCategory.includes(category.slug) ? isOpen = true : null)
</script>
<div class="flex items-center justify-between w-full"  style="padding-left: {indent}px">
	<a {href} class="hover:text-blue-500 truncate w-full text-left text-sm px-2 py-1 rounded-full {isActive ? 'bg-gray-200' : ''}">
		{category.name}
	</a>
	{#if category.children.length > 0}
		<button on:click={toggle} class="hover:text-blue-500 {isOpen ? 'rotate-90' : ''}">
			<ChevronRight />
		</button>
	{/if}
</div>
{#if isOpen}
	{#each category.children as category2}
		<svelte:self category={category2} {selectedCategory} href="{href}/{category2.slug}" indent={indent + 10} />
	{/each}
{/if}
