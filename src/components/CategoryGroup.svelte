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

<div class="w-full" style="padding-left: {indent * 12}px">
	{#if hasChildren}
		<Collapsible.Root bind:open={isOpen} class="w-full">
			<div class="flex items-center w-full rounded-full transition-colors {isActive
				? 'bg-gray-100 dark:bg-gray-700'
				: 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}">
				<a
					{href}
					class="truncate flex-1 text-left text-sm px-3 py-1.5 {isActive ? 'font-medium' : ''}"
				>
					{category.name} {#if category.count}<span class="text-gray-400">({category.count})</span>{/if}
				</a>
				<Collapsible.Trigger class="p-1.5 cursor-pointer transition-transform duration-150 {isOpen ? 'rotate-90' : ''}">
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
						indent={indent + 1}
					/>
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	{:else}
		<a
			{href}
			class="block truncate w-full text-left text-sm px-3 py-1.5 rounded-full transition-colors {isActive
				? 'bg-gray-100 dark:bg-gray-700 font-medium'
				: 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}"
		>
			{category.name} {#if category.count}<span class="text-gray-400">({category.count})</span>{/if}
		</a>
	{/if}
</div>
