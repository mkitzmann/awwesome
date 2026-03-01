<script lang="ts">
	import SearchIcon from './icons/SearchIcon.svelte';
	import XMarkIcon from './icons/XMarkIcon.svelte';
	import { page } from '$app/stores';
	import { createEventDispatcher, onMount } from 'svelte';

	export let searchTerm = '';

	const dispatch = createEventDispatcher<{ search: string }>();

	onMount(() => {
		const initial = $page.url.searchParams.get('search') ?? '';
		if (initial) {
			searchTerm = initial;
			dispatch('search', initial);
		}
	});

	const setQueryParams = () => {
		const url = new URL(window.location);
		if (searchTerm !== '') {
			url.searchParams.set('search', searchTerm);
		} else {
			url.searchParams.delete('search');
		}
		history.pushState(null, '', url);
		dispatch('search', searchTerm);
	};

	let timer: ReturnType<typeof setTimeout>;
	const debounceSearch = () => {
		clearTimeout(timer);
		timer = setTimeout(setQueryParams, 400);
	};

	const clearSearchTerm = () => {
		searchTerm = '';
		clearTimeout(timer);
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
		on:input={debounceSearch}
		class="rounded-full pr-8 pl-12 py-2 w-full font-light placeholder-gray-400 dark:bg-gray-800"
		placeholder="Search in Category"
	/>
</div>
