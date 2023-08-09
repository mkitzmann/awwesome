<script lang="ts">
	import type { Category } from '../lib/types/types';

	export let href: string;
	export let name: string
	// export let selectedCategory: Category;
	// {selectedCategory === category.slug ? 'bg-gray-200' : ''}
</script>

<a
	{href}
	class="truncate max-w-full xl:max-w-full text-left text-sm px-2 py-1 rounded-full
							"
>
	<!--		on:click={setCategory(category.slug)}-->
	{name}
</a>
