<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let platforms: string[] = [];

	const dispatch = createEventDispatcher<{ filter: void }>();

	export let minStars: string = '';
	export let minCommitsYear: string = '';
	export let platform: string = '';

	let expanded = false;

	function applyFilters() {
		dispatch('filter');
	}

	function clearFilters() {
		minStars = '';
		minCommitsYear = '';
		platform = '';
		dispatch('filter');
	}

	$: hasActiveFilters = minStars !== '' || minCommitsYear !== '' || platform !== '';
</script>

<div class="relative">
	<button
		on:click={() => (expanded = !expanded)}
		class="px-4 py-1 rounded-full text-sm
			{hasActiveFilters ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200' : 'bg-gray-200 dark:bg-gray-800'}
			hover:bg-gray-100 dark:hover:bg-gray-700"
	>
		Filters{hasActiveFilters ? ' *' : ''}
	</button>
	{#if expanded}
		<div
			class="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[260px] flex flex-col gap-3"
		>
			<div>
				<label for="minStars" class="block text-xs text-gray-500 mb-1">Min Stars</label>
				<select
					id="minStars"
					bind:value={minStars}
					on:change={applyFilters}
					class="w-full rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
				>
					<option value="">Any</option>
					<option value="100">100+</option>
					<option value="500">500+</option>
					<option value="1000">1,000+</option>
					<option value="5000">5,000+</option>
					<option value="10000">10,000+</option>
				</select>
			</div>

			<div>
				<label for="minCommitsYear" class="block text-xs text-gray-500 mb-1">Activity (commits/year)</label>
				<select
					id="minCommitsYear"
					bind:value={minCommitsYear}
					on:change={applyFilters}
					class="w-full rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
				>
					<option value="">Any</option>
					<option value="10">Active (10+)</option>
					<option value="50">Moderate (50+)</option>
					<option value="100">Very active (100+)</option>
					<option value="500">Highly active (500+)</option>
				</select>
			</div>

			<div>
				<label for="platform" class="block text-xs text-gray-500 mb-1">Platform / Language</label>
				<select
					id="platform"
					bind:value={platform}
					on:change={applyFilters}
					class="w-full rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
				>
					<option value="">Any</option>
					{#each platforms as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
			</div>

			{#if hasActiveFilters}
				<button
					on:click={clearFilters}
					class="text-xs text-blue-600 dark:text-blue-400 hover:underline self-end"
				>
					Clear all filters
				</button>
			{/if}
		</div>
	{/if}
</div>
