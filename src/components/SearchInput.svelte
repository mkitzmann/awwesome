<script lang="ts">
	import SearchIcon from './icons/SearchIcon.svelte';
	import XMarkIcon from './icons/XMarkIcon.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let searchTerm;

	onMount(() => {
		searchTerm = $page.url.searchParams.get(searchKey) ?? '';
	});

	const searchKey = 'search';
	const setQueryParams = () => {
		const url = new URL(window.location);
		if (searchTerm !== '') {
			url.searchParams.set(searchKey, searchTerm);
		} else {
			url.searchParams.delete(searchKey);
		}
		history.pushState(null, '', url);
	};

	let timer;
	const debounceSetQueryParams = () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			setQueryParams();
		}, 750);
	};

	const clearSearchTerm = () => {
		searchTerm = '';
		setQueryParams();
	};
</script>

<div class="relative w-full max-w-sm">
	<div class="absolute flex items-center h-full ml-4 text-gray-400">
		<SearchIcon />
	</div>
	{#if searchTerm.length > 0}
		<button
			on:click={clearSearchTerm}
			class="absolute flex items-center h-full right-3 text-gray-200 hover:text-blue-400"
		>
			<XMarkIcon />
		</button>
	{/if}
	<input
		name="search"
		bind:value={searchTerm}
		on:input={debounceSetQueryParams}
		class="rounded-full pr-8 pl-12 py-2 w-full font-light placeholder-gray-400 dark:bg-gray-800"
		placeholder="Search in Category"
	/>
</div>
