<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import type { SortTerm } from '../lib/types/types';
	import type { Snippet } from 'svelte';

	let {
		value,
		rounded,
		children
	}: {
		value: SortTerm;
		rounded: 'left' | 'right' | 'none';
		children: Snippet;
	} = $props();
</script>

<ToggleGroup.Item
	value={value}
	class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700
		data-[state=on]:bg-gray-100 data-[state=on]:dark:bg-gray-700
		data-[state=off]:bg-gray-200 data-[state=off]:dark:bg-gray-800
		{rounded === 'left' ? 'rounded-l-full' : ''}
		{rounded === 'right' ? 'rounded-r-full' : ''}"
>
	{@render children()}
</ToggleGroup.Item>
