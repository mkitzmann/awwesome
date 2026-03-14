<script lang="ts">
	import SearchIcon from './icons/SearchIcon.svelte';
	import XMarkIcon from './icons/XMarkIcon.svelte';

	let {
		searchTerm = $bindable(''),
		onsearch
	}: {
		searchTerm?: string;
		onsearch?: (term: string) => void;
	} = $props();

	let timer: ReturnType<typeof setTimeout>;
	const debounceSearch = () => {
		clearTimeout(timer);
		timer = setTimeout(() => onsearch?.(searchTerm), 400);
	};

	const clearSearchTerm = () => {
		searchTerm = '';
		clearTimeout(timer);
		onsearch?.('');
	};
</script>

<div class="relative w-full max-w-sm">
	<div class="absolute flex items-center h-full ml-4 text-gray-400">
		<SearchIcon />
	</div>
	{#if searchTerm.length > 0}
		<button
			onclick={clearSearchTerm}
			class="absolute flex items-center h-full right-3 text-gray-200 hover:text-blue-400"
		>
			<XMarkIcon />
		</button>
	{/if}
	<input
		name="search"
		bind:value={searchTerm}
		oninput={debounceSearch}
		class="rounded-full pr-8 pl-12 py-2 w-full font-light placeholder-gray-400 dark:bg-gray-800"
		placeholder="Search in Category"
	/>
</div>
