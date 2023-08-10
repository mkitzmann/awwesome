<script lang="ts">
	import {goto} from "$app/navigation";

	export let categories = []
	let selectedCategory = []

	const setSelectCategory = (event) => {
		const selected = event.target.value
	  console.log(selected)
		if (!selected) {
			goto('/');
			return;
		}
		goto(`/${selected}`);
	};
</script>

<select
		bind:value={selectedCategory[0]}
		on:change={setSelectCategory}
		class="rounded-full px-4 py-2 xl:hidden"
>
	{#each categories as category}
		{#if category}
			<option value={category.slug}>
				{category.name}
			</option>
		{/if}
	{/each}
</select>
<!--{#if isOpen}-->
<!--	{#each category.children as category2}-->
<!--		<svelte:self category={category2} href="{href}/{category2.slug}" indent={indent + 10} />-->
<!--	{/each}-->
<!--{/if}-->
