<script lang="ts">
	import type { SortTerm } from '../lib/types/types';
	import type { Snippet } from 'svelte';

	let {
		sortTerm,
		selectedSortTerm = $bindable(),
		rounded,
		children
	}: {
		sortTerm: SortTerm;
		selectedSortTerm: SortTerm;
		rounded: 'left' | 'right' | 'none';
		children: Snippet;
	} = $props();

	let isActive = $derived(selectedSortTerm === sortTerm);
</script>

<button
	disabled={isActive}
	onclick={() => (selectedSortTerm = sortTerm)}
	class=" px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700
		{isActive ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-800'}
		{rounded === 'left' ? 'rounded-l-full' : ''}
		{rounded === 'right' ? 'rounded-r-full' : ''}
	"
>
	{@render children()}
</button>
