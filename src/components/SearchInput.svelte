<script lang="ts">
	import SearchIcon from "./SearchIcon.svelte";

		export let searchTerm;
</script>
<div class="relative w-full">
	<div class="absolute flex items-center h-full ml-4 text-gray-400">
		<SearchIcon />
	</div>
	<input name="search" bind:value={searchTerm} class="rounded-full px-4 pl-12 py-2 w-full max-w-sm font-light placeholder-gray-300" placeholder="Search in Category">
</div>
