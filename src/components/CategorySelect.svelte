<script lang="ts">
	import type { Category } from '../lib/types/types';
	import { allCategory } from '$lib';
	import CategorySelect from './CategorySelect.svelte';

	let {
		categories = [],
		selectedCategory = '',
		onchange
	}: {
		categories?: Category[];
		selectedCategory?: string;
		onchange?: (value: string) => void;
	} = $props();

	const setSelectCategory = (value: string) => {
		onchange?.(value);
	};

	const setChildCategory = (value: string) => {
		onchange?.(currentCategoryString + '/' + value);
	};

	let currentCategoryString = $derived(selectedCategory.split('/')[0]);

	let currentCategory = $derived(categories.find(
		(category) => category.slug === selectedCategory.split('/')[0]
	));

	let hasChildren = $derived((currentCategory?.children?.length ?? 0) > 0);
</script>

<select
	bind:value={currentCategoryString}
	onchange={() => setSelectCategory(currentCategoryString)}
	class="rounded-full px-4 py-2 h-10g w-full max-w-sm border-r-8 border-transparent dark:bg-gray-800"
>
	<option value={allCategory.slug}>
		{allCategory.name}
	</option>
	{#each categories as category}
		{#if category}
			<option value={category.slug}>
				{category.name}
			</option>
		{/if}
	{/each}
</select>
{#if hasChildren && currentCategory}
	<CategorySelect
		categories={currentCategory.children}
		selectedCategory={selectedCategory.split('/').splice(1).join('/')}
		onchange={setChildCategory}
	/>
{/if}
