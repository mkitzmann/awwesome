<script lang="ts">
	import ChevronRight from './ChevronRight.svelte';
	import { navigating } from '$app/stores';
	import type { Category } from '../lib/types/types';
	import { Collapsible } from 'bits-ui';
	import CategoryGroup from './CategoryGroup.svelte';

	let {
		category,
		selectedCategory = '',
		indent = 0,
		sortSuffix = '',
		basePath = '/' + category.slug
	}: {
		category: Category;
		selectedCategory?: string;
		indent?: number;
		sortSuffix?: string;
		basePath?: string;
	} = $props();

	let href = $derived(basePath + sortSuffix);

	let isOpen = $state(false);

	$effect(() => {
		if ($navigating) {
			isOpen = selectedCategory.includes(category.slug);
		}
	});

	let isActive = $derived(selectedCategory === basePath.slice(1));
	let hasChildren = $derived((category.children ?? []).length > 0);
</script>

<div class="flex items-center justify-between w-full" style="padding-left: {indent}px">
	{#if hasChildren}
		<Collapsible.Root bind:open={isOpen} class="w-full">
			<div class="flex justify-between w-full items-center">
				<a
					{href}
					class="hover:text-blue-500 truncate w-full text-left text-sm px-3 py-1 rounded-full {isActive
						? 'bg-gray-200 dark:bg-gray-950'
						: ''}"
				>
					{category.name}
				</a>
				<Collapsible.Trigger class="hover:text-blue-500 cursor-pointer transition-transform duration-150 {isOpen ? 'rotate-90' : ''}">
					<ChevronRight />
				</Collapsible.Trigger>
			</div>
			<Collapsible.Content>
				{#each category.children ?? [] as category2}
					<CategoryGroup
						category={category2}
						{selectedCategory}
						{sortSuffix}
						basePath="{basePath}/{category2.slug}"
						indent={indent + 10}
					/>
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
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
