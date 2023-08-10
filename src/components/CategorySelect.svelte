<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Category } from '../lib/types/types';
		import {allCategory} from "$lib";

	export let categories: Category[] = [];
	export let level = 0;
	let selectedCategory;

	const setSelectCategory = (event) => {
		const selected = event.target.value;
		console.log(selected);
		if (!selected) {
			goto('/');
			return;
		}
		goto(`/${selected}`);
	};

	$: currentCategory =
		categories.find((category) => category.slug === selectedCategory);

	$: hasChildren =
		currentCategory?.children.length > 0;
</script>

<select
	bind:value={selectedCategory}
	on:change={setSelectCategory}
	class="rounded-full px-4 py-2 xl:hidden"
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
{#if hasChildren}
		<svelte:self categories={currentCategory.children} />
{/if}
