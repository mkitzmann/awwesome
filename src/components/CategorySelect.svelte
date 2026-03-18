<script lang="ts">
	import type { Category } from '../lib/types/types';
	import { allCategory } from '$lib';
	import { Select } from 'bits-ui';
	import CategorySelect from './CategorySelect.svelte';

	let {
		categories = [],
		selectedCategory = '',
		onchange
	}: {
		categories?: Category[];
		selectedCategory?: string;
		onchange?: (value: string) => void;
	} = $props();

	let currentCategoryString = $derived(selectedCategory.split('/')[0]);

	let currentCategory = $derived(
		categories.find((category) => category.slug === selectedCategory.split('/')[0])
	);

	let hasChildren = $derived((currentCategory?.children?.length ?? 0) > 0);

	let items = $derived([
		{ value: allCategory.slug, label: allCategory.name },
		...categories.filter(Boolean).map((c) => ({ value: c.slug, label: c.name }))
	]);

	function handleValueChange(value: string) {
		onchange?.(value);
	}
</script>

<Select.Root type="single" value={currentCategoryString} onValueChange={handleValueChange} {items}>
	<Select.Trigger
		class="rounded-full px-4 py-2 h-10 w-full max-w-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-left flex items-center justify-between gap-2"
	>
		{items.find((i) => i.value === currentCategoryString)?.label ?? 'Select category'}
		<svg
			class="w-4 h-4 shrink-0 opacity-50"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M6 9l6 6 6-6" />
		</svg>
	</Select.Trigger>

	<Select.Portal>
		<Select.Content
			class="z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-1 max-h-[300px] overflow-y-auto"
			sideOffset={4}
		>
			<Select.Viewport>
				{#each items as item}
					<Select.Item
						value={item.value}
						label={item.label}
						class="px-3 py-1.5 text-sm rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 data-[highlighted]:bg-gray-100 data-[highlighted]:dark:bg-gray-700 data-[state=checked]:font-semibold"
					>
						{item.label}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>

{#if hasChildren && currentCategory}
	<CategorySelect
		categories={currentCategory.children}
		selectedCategory={selectedCategory.split('/').splice(1).join('/')}
		onchange={(value) => onchange?.(currentCategoryString + '/' + value)}
	/>
{/if}
