<script lang="ts">
	import type { Category } from '../lib/types/types';
	import { allCategory } from '$lib';
	import { createEventDispatcher } from 'svelte';

	export let categories: Category[] = [];
	export let selectedCategory = '';

	const dispatch = createEventDispatcher<{ change: string }>();

	const setSelectCategory = (value: string) => {
		dispatch('change', value);
	};

	const setChildCategory = (event: CustomEvent<string>) => {
		dispatch('change', currentCategoryString + '/' + event.detail);
	};

	$: currentCategoryString = selectedCategory.split('/')[0];

	$: currentCategory = categories.find(
		(category) => category.slug === selectedCategory.split('/')[0]
	);

	$: hasChildren = (currentCategory?.children?.length ?? 0) > 0;
</script>

<select
	bind:value={currentCategoryString}
	on:change={() => setSelectCategory(currentCategoryString)}
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
	<svelte:self
		categories={currentCategory.children}
		selectedCategory={selectedCategory.split('/').splice(1).join('/')}
		on:change={setChildCategory}
	/>
{/if}
