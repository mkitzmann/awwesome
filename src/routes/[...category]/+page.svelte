<script lang="ts">
	import type { ProjectCollection, Project, SortOrder, SortTerm } from '../../lib/types/types';
	import ProjectItem from '../../components/ProjectItem.svelte';
	import { page } from '$app/stores';
	import { removeTrailingSlashes } from '../../lib';
	import { categoryStore } from '../../stores/stores';
	import CategoryGroup from '../../components/CategoryGroup.svelte';
	import CategorySelect from '../../components/CategorySelect.svelte';
	import { allCategory } from '$lib';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import SearchInput from '../../components/SearchInput.svelte';
	import SortButton from '../../components/SortButton.svelte';
	import FilterPanel from '../../components/FilterPanel.svelte';
	import DarkModeSwitch from '../../components/DarkModeSwitch.svelte';
	import StarOnGithub from '../../components/StarOnGithub.svelte';
	import { ToggleGroup } from 'bits-ui';
	import SvelteSeo from 'svelte-seo';

	let { data }: { data: ProjectCollection } = $props();

	let category = $derived(removeTrailingSlashes($page.params?.category) ?? '');
	let selectedCategory = $state('');

	$effect(() => {
		selectedCategory = category;
	});

	// ── Local state for API-driven loading ──

	let projects: Project[] = $state(data.projects);
	let total: number = $state(data.total);
	let searchTerm = $state('');
	let selectedSortTerm: SortTerm = $state('stars');
	let selectedSortOrder: SortOrder = $state('desc');
	let loading = $state(false);

	// Filter state
	let filterMinStars = $state('');
	let filterMinCommitsYear = $state('');
	let filterPlatform = $state('');

	// ── Hydrate state from URL params on mount ──
	let initialized = false;
	onMount(() => {
		const params = $page.url.searchParams;
		searchTerm = params.get('search') ?? '';
		const sort = params.get('sort') as SortTerm | null;
		if (sort && ['stars', 'commitsYear', 'firstAdded'].includes(sort)) {
			selectedSortTerm = sort;
		}
		const order = params.get('order') as SortOrder | null;
		if (order && ['asc', 'desc'].includes(order)) {
			selectedSortOrder = order;
		}
		filterMinStars = params.get('minStars') ?? '';
		filterMinCommitsYear = params.get('minCommitsYear') ?? '';
		filterPlatform = params.get('platform') ?? '';

		initialized = true;

		// If any filters are active from URL, re-fetch with them applied
		const hasFilters = searchTerm || filterMinStars || filterMinCommitsYear || filterPlatform
			|| selectedSortTerm !== 'stars' || selectedSortOrder !== 'desc';
		if (hasFilters) {
			fetchProjects();
		}
	});

	// Update projects when server data changes (category navigation)
	let prevCategory = $state('');
	$effect(() => {
		categoryStore.set(data.categories);
		projects = data.projects;
		total = data.total;
		// Re-fetch with active filters only when the category actually changes
		if (initialized && category !== prevCategory) {
			prevCategory = category;
			fetchProjects();
		}
	});

	// ── Sync state to URL params ──
	function syncUrlParams() {
		const url = new URL(window.location.href);
		const defaults: Record<string, string> = { sort: 'stars', order: 'desc' };
		const state: Record<string, string> = {
			search: searchTerm,
			sort: selectedSortTerm,
			order: selectedSortOrder,
			minStars: filterMinStars,
			minCommitsYear: filterMinCommitsYear,
			platform: filterPlatform
		};
		for (const [key, value] of Object.entries(state)) {
			if (value && value !== (defaults[key] ?? '')) {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}
		history.replaceState(null, '', url);
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
		if (filterMinStars) params.set('minStars', filterMinStars);
		if (filterMinCommitsYear) params.set('minCommitsYear', filterMinCommitsYear);
		if (filterPlatform) params.set('platform', filterPlatform);

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
			if (!opts.append) syncUrlParams();
		} finally {
			loading = false;
		}
	}

	function handleSearch(term: string) {
		searchTerm = term;
		fetchProjects();
	}

	let prevSortTerm: SortTerm = $state('stars');
	$effect(() => {
		if (selectedSortTerm !== prevSortTerm) {
			prevSortTerm = selectedSortTerm;
			fetchProjects();
		}
	});

	function loadMore() {
		fetchProjects({ append: true, offset: projects.length });
	}

	let categoryNames: Record<string, string> = $state({});

	const unsubscribeCategory = categoryStore.subscribe((value) => {
		categoryNames = value.names;
	});
	onDestroy(unsubscribeCategory);

	const setSelectedCategory = (value: string) => {
		selectedCategory = value;
		goto(`/${value}`);
	};

	const baseTitle = 'awwesome selfhosted';
	const baseDescription =
		'Find the most awesome open-source, self-hostable projects on the web. Original data by the awesome-selfhosted community, licensed under CC-BY-SA 3.0.';

	let categoryLabel = $derived(
		category
			? category
					.split('/')
					.map((c) => data.categories.names[c])
					.filter(Boolean)
					.join(' - ')
			: ''
	);
	let pageTitle = $derived(categoryLabel ? `${categoryLabel} - ${baseTitle}` : baseTitle);
	let pageDescription = $derived(
		categoryLabel
			? `Discover the best self-hosted ${categoryLabel} projects. ${baseDescription}`
			: baseDescription
	);
	let pageUrl = $derived(
		category ? `https://www.awweso.me/${category}` : 'https://www.awweso.me'
	);
</script>

<SvelteSeo
	title={pageTitle}
	description={pageDescription}
	openGraph={{
		title: pageTitle,
		description: pageDescription,
		url: pageUrl,
		type: 'website',
		images: [
			{
				url: 'https://www.awweso.me/awwesome_og.png',
				width: 1200,
				height: 630,
				alt: 'awwesome selfhosted'
			}
		],
		site_name: 'awwesome selfhosted'
	}}
	twitter={{
		card: 'summary_large_image',
		title: pageTitle,
		description: pageDescription,
		image: 'https://www.awweso.me/awwesome_og.png'
	}}
/>

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
			<SearchInput bind:searchTerm onsearch={handleSearch} />
			<CategorySelect
				categories={data.categories.tree}
				{selectedCategory}
				onchange={setSelectedCategory}
			/>
		</div>
		<aside class="max-w-[20%] hidden xl:block">
			<SearchInput bind:searchTerm onsearch={handleSearch} />
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
					<ToggleGroup.Root type="single" bind:value={selectedSortTerm} class="text-sm flex">
						<SortButton value="stars" rounded="left">
							Most Stars
						</SortButton>
						<SortButton value="commitsYear" rounded="none">
							Most Active
						</SortButton>
						<SortButton value="firstAdded" rounded="right">
							Recently Added
						</SortButton>
					</ToggleGroup.Root>
					<FilterPanel
						platforms={data.platforms}
						bind:minStars={filterMinStars}
						bind:minCommitsYear={filterMinCommitsYear}
						bind:platform={filterPlatform}
						onfilter={() => fetchProjects()}
					/>
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
						onclick={loadMore}
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
