<script lang="ts">
	import { Popover } from 'bits-ui';
	import { Funnel } from 'lucide-svelte';

	let {
		platforms = [],
		licenses = [],
		minStars = $bindable(''),
		minCommitsYear = $bindable(''),
		platform = $bindable(''),
		license = $bindable(''),
		releasedAfter = $bindable(''),
		onfilter
	}: {
		platforms?: string[];
		licenses?: string[];
		minStars?: string;
		minCommitsYear?: string;
		platform?: string;
		license?: string;
		releasedAfter?: string;
		onfilter?: () => void;
	} = $props();

	let open = $state(false);

	function applyFilters() {
		onfilter?.();
	}

	function clearFilters() {
		minStars = '';
		minCommitsYear = '';
		platform = '';
		license = '';
		releasedAfter = '';
		onfilter?.();
	}

	let hasActiveFilters = $derived(minStars !== '' || minCommitsYear !== '' || platform !== '' || license !== '' || releasedAfter !== '');
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class="px-4 h-10 flex items-center rounded-full text-sm border border-gray-200 dark:border-gray-700
			{hasActiveFilters
			? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
			: 'bg-gray-200 dark:bg-gray-800'}
			hover:bg-gray-100 dark:hover:bg-gray-700"
	>
		<Funnel class="w-4 h-4 mr-1.5" />{hasActiveFilters ? 'Filters *' : 'Filters'}
	</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content
			side="bottom"
			align="end"
			sideOffset={8}
			class="z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[260px] flex flex-col gap-3"
		>
			<div>
				<label for="minStars" class="block text-xs text-gray-500 mb-1">Min Stars</label>
				<select
					id="minStars"
					bind:value={minStars}
					onchange={applyFilters}
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
				<label for="minCommitsYear" class="block text-xs text-gray-500 mb-1"
					>Activity (commits/year)</label
				>
				<select
					id="minCommitsYear"
					bind:value={minCommitsYear}
					onchange={applyFilters}
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
				<label for="platform" class="block text-xs text-gray-500 mb-1"
					>Platform / Language</label
				>
				<select
					id="platform"
					bind:value={platform}
					onchange={applyFilters}
					class="w-full rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
				>
					<option value="">Any</option>
					{#each platforms as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="license" class="block text-xs text-gray-500 mb-1">License</label>
				<select
					id="license"
					bind:value={license}
					onchange={applyFilters}
					class="w-full rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
				>
					<option value="">Any</option>
					{#each licenses as l}
						<option value={l}>{l}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="releasedAfter" class="block text-xs text-gray-500 mb-1">Latest Release</label>
				<select
					id="releasedAfter"
					bind:value={releasedAfter}
					onchange={applyFilters}
					class="w-full rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
				>
					<option value="">Any</option>
					<option value={new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)}>Last 30 days</option>
					<option value={new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)}>Last 3 months</option>
					<option value={new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10)}>Last 6 months</option>
					<option value={new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)}>Last year</option>
				</select>
			</div>

			{#if hasActiveFilters}
				<button
					onclick={clearFilters}
					class="text-xs text-blue-600 dark:text-blue-400 hover:underline self-end"
				>
					Clear all filters
				</button>
			{/if}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
