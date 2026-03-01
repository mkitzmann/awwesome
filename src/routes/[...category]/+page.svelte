<script lang="ts">
	import type { ProjectCollection, Project, SortOrder, SortTerm } from '../../lib/types/types';
	import ProjectItem from '../../components/ProjectItem.svelte';
	import { page } from '$app/stores';
	import { removeTrailingSlashes } from '../../lib';
	import { categoryStore } from '../../stores/stores';
	import CategoryGroup from '../../components/CategoryGroup.svelte';
	import CategorySelect from '../../components/CategorySelect.svelte';
	import { allCategory } from '$lib';
	import { beforeUpdate } from 'svelte';
	import { goto } from '$app/navigation';
	import SearchInput from '../../components/SearchInput.svelte';
	import SortButton from '../../components/SortButton.svelte';
	import DarkModeSwitch from '../../components/DarkModeSwitch.svelte';
	import StarOnGithub from '../../components/StarOnGithub.svelte';

	export let data: ProjectCollection;
	categoryStore.set(data.categories);

	$: category = removeTrailingSlashes($page.params?.category) ?? '';

	let selectedCategory = '';
	beforeUpdate(() => {
		selectedCategory = category;
	});

	// ── Local state for API-driven loading ──

	let projects: Project[] = data.projects;
	let total: number = data.total;
	let searchTerm = '';
	let selectedSortTerm: SortTerm = 'stars';
	let selectedSortOrder: SortOrder = 'desc';
	let loading = false;

	// Reset when server data changes (category navigation)
	$: {
		data; // track dependency
		projects = data.projects;
		total = data.total;
		searchTerm = '';
		selectedSortTerm = 'stars';
		selectedSortOrder = 'desc';
	}

	async function fetchProjects(opts: { append?: boolean; offset?: number } = {}) {
		const categoryPath = '/' + (category || '');
		const params = new URLSearchParams({
			category: categoryPath,
			sort: selectedSortTerm,
			order: selectedSortOrder,
			limit: '20',
			offset: String(opts.offset ?? 0)
		});
		if (searchTerm) params.set('search', searchTerm);

		loading = true;
		try {
			const res = await fetch(`/api/projects?${params}`);
			const result = await res.json();

			// Rehydrate date strings from JSON
			for (const p of result.projects) {
				if (p.firstAdded) p.firstAdded = new Date(p.firstAdded);
				if (p.pushedAt) p.pushedAt = new Date(p.pushedAt);
			}

			if (opts.append) {
				projects = [...projects, ...result.projects];
			} else {
				projects = result.projects;
			}
			total = result.total;
		} finally {
			loading = false;
		}
	}

	function handleSearch(event: CustomEvent<string>) {
		searchTerm = event.detail;
		fetchProjects();
	}

	let prevSortTerm: SortTerm = selectedSortTerm;
	$: if (selectedSortTerm !== prevSortTerm) {
		prevSortTerm = selectedSortTerm;
		fetchProjects();
	}

	function loadMore() {
		fetchProjects({ append: true, offset: projects.length });
	}

	let categoryNames: Record<string, string>;

	categoryStore.subscribe((value) => {
		categoryNames = value.names;
	});

	const setSelectedCategory = (event: CustomEvent<string>) => {
		selectedCategory = event.detail;
		goto(`/${event.detail}`);
	};
</script>

<div class="flex flex-col gap-4 mx-auto my-4 p-4">
	<div class="flex justify-between flex-wrap gap-2">
		<div>
			<a href="/" class="block">
				<div class="flex gap-4 items-center mb-4">
					<img src="/logo_complete_dark.svg" alt="Logo" class="h-16 mb-4 hidden dark:block" />
					<img src="/logo_complete_light.svg" alt="Logo" class="h-16 mb-4 dark:hidden" />
				</div>
			</a>
			<div class="text-sm -mt-2">
				Original data by the <a href="https://github.com/awesome-selfhosted/awesome-selfhosted-data"
					>awesome-selfhosted</a
				>
				community, licensed under
				<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA 3.0</a>
			</div>
		</div>

		<div class="flex gap-8">
			<StarOnGithub />
			<DarkModeSwitch />
		</div>
	</div>
	<div class="flex flex-col xl:flex-row gap-6 xl:gap-12">
		<div class="xl:hidden flex flex-wrap gap-4">
			<SearchInput bind:searchTerm on:search={handleSearch} />
			<CategorySelect
				categories={data.categories.tree}
				{selectedCategory}
				on:change={setSelectedCategory}
			/>
		</div>
		<aside class="max-w-[20%] hidden xl:block">
			<SearchInput bind:searchTerm on:search={handleSearch} />
			<nav class="flex gap-1 flex-row flex-wrap lg:flex-col mt-4">
				<a
					href="/"
					class="truncate max-w-full xl:max-w-full text-left text-sm px-3 py-1 rounded-full {selectedCategory ===
					''
						? 'bg-gray-200 dark:bg-gray-950'
						: ''}"
				>
					{allCategory.name}
				</a>
				{#each data.categories.tree as category}
					{#if category}
						<CategoryGroup {category} {selectedCategory} />
					{/if}
				{/each}
			</nav>
		</aside>
		<div class="w-full">
			<div class="flex justify-between items-center flex-wrap gap-4 mb-8 mt-2">
				<h2 class="font-bold text-xl">
					{selectedCategory
						.split('/')
						.map((category) => categoryNames[category])
						.join(' - ')}
				</h2>
				<div class="flex items-center gap-4 flex-wrap">
					<div class="text-sm">
						<SortButton bind:selectedSortTerm sortTerm="stars" rounded="left">
							Most Stars
						</SortButton>
						<SortButton bind:selectedSortTerm sortTerm="firstAdded" rounded="right">
							Recently Added
						</SortButton>
					</div>
					<div class="text-sm text-right">
						{total} Projects
					</div>
				</div>
			</div>
			<div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
				{#each projects as project}
					<ProjectItem {project} />
				{/each}
			</div>
			<div class="flex mt-8">
				{#if projects.length < total}
					<button
						on:click={loadMore}
						disabled={loading}
						class="mx-auto bg-blue-100 dark:bg-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full px-4 py-2 disabled:opacity-50"
					>
						{loading ? 'Loading...' : 'Show more'}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
