<script lang="ts">
	import SearchIcon from './SearchIcon.svelte';
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
</script>

<div class="relative w-full">
	<div class="absolute flex items-center h-full ml-4 text-gray-400">
		<SearchIcon />
	</div>
	<input
		name="search"
		bind:value={searchTerm}
		on:input={debounceSetQueryParams}
		class="rounded-full px-4 pl-12 py-2 w-full max-w-sm font-light placeholder-gray-400"
		placeholder="Search in Category"
	/>
</div>
