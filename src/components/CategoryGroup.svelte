<script lang="ts">
	import ChevronRight from './ChevronRight.svelte';
	import { navigating } from '$app/stores';
	import type { Category } from '../lib/types/types';
	export let category: Category;
	export let selectedCategory;
	export let indent = 0;

	export let href = '/' + category.slug;

	let isOpen = false;
	$: if ($navigating) selectedCategory.includes(category.slug) ? (isOpen = true) : (isOpen = false);
	$: isActive = selectedCategory === href.slice(1);
</script>

<div class="flex items-center justify-between w-full" style="padding-left: {indent}px">
	{#if category.children.length > 0}
		<details bind:open={isOpen} class="w-full group">
			<summary class="flex justify-between w-full items-center">
				<a
					{href}
					class="hover:text-blue-500 truncate w-full text-left text-sm px-3 py-1 rounded-full {isActive
						? 'bg-gray-200 dark:bg-gray-950'
						: ''}"
				>
					{category.name}
				</a>
				<div class="hover:text-blue-500 cursor-pointer group-open:rotate-90">
					<ChevronRight />
				</div>
			</summary>
			{#each category.children as category2}
				<svelte:self
					category={category2}
					{selectedCategory}
					href="{href}/{category2.slug}"
					indent={indent + 10}
				/>
			{/each}
		</details>
		<!--		<button on:click={toggle} class="hover:text-blue-500 {isOpen ? 'rotate-90' : ''}">-->
		<!--			<ChevronRight />-->
		<!--		</button>-->
	{:else}
		<a
			{href}
			class="hover:text-blue-500 truncate w-full text-left text-sm px-3 py-1 rounded-full {isActive
				? 'bg-gray-200 dark:bg-gray-950'
				: ''}"
		>
			{category.name}
		</a>
	{/if}
</div>
