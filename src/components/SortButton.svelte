<script lang="ts">
	import type { SortTerm } from '../lib/types/types';

	export let sortTerm: SortTerm;
	export let selectedSortTerm: SortTerm;
	export let rounded: 'left' | 'right' | 'none';

	$: isActive = selectedSortTerm === sortTerm;
</script>

<button
	disabled={isActive}
	on:click={() => (selectedSortTerm = sortTerm)}
	class=" px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700
		{isActive ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-800'}
		{rounded === 'left' ? 'rounded-l-full' : ''}
		{rounded === 'right' ? 'rounded-r-full' : ''}
	"
>
	<slot />
</button>
