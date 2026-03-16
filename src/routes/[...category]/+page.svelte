<script lang="ts">
	import type { ProjectCollection, Project, SortOrder, SortTerm } from '../../lib/types/types';
	import ProjectItem from '../../components/ProjectItem.svelte';
	import { page } from '$app/stores';
	import { removeTrailingSlashes } from '../../lib';
	import { categoryStore } from '../../stores/stores';
	import CategoryGroup from '../../components/CategoryGroup.svelte';
	import CategorySelect from '../../components/CategorySelect.svelte';
	import { allCategory } from '$lib';
	import { goto, replaceState } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import SearchInput from '../../components/SearchInput.svelte';
	import SortButton from '../../components/SortButton.svelte';
	import FilterPanel from '../../components/FilterPanel.svelte';
	import DarkModeSwitch from '../../components/DarkModeSwitch.svelte';
	import StarOnGithub from '../../components/StarOnGithub.svelte';
	import { ToggleGroup, Select } from 'bits-ui';
	import SvelteSeo from 'svelte-seo';
	import { SORT_SLUGS, sortTermToSlug } from '$lib/sort';

	let { data }: { data: ProjectCollection } = $props();

	let sortSuffix = $derived.by(() => {
		const slug = sortTermToSlug(selectedSortTerm);
		return slug ? `/${slug}` : '';
	});

	// Derive category by stripping any sort slug from the URL path
	let category = $derived.by(() => {
		const raw = removeTrailingSlashes($page.params?.category) ?? '';
		const segments = raw ? raw.split('/') : [];
		if (segments.length && SORT_SLUGS.has(segments[segments.length - 1])) {
			segments.pop();
		}
		return segments.join('/');
	});
	let selectedCategory = $state('');

	$effect(() => {
		selectedCategory = category;
	});

	// ── Local state for API-driven loading ──
	// Client-fetched overrides; null means "use server data"
	let clientProjects: Project[] | null = $state(null);
	let clientTotal: number | null = $state(null);
	let projects = $derived(clientProjects ?? data.projects);
	let total = $derived(clientTotal ?? data.total);
	let searchTerm = $state('');
	let selectedSortTerm: SortTerm = $state('stars');
	let selectedSortOrder: SortOrder = $state('desc');
	let loading = $state(false);

	// Filter state
	let filterMinStars = $state('');
	let filterMinCommitsYear = $state('');
	let filterPlatform = $state('');
	let filterLicense = $state('');

	let isDefaultView = $derived(!category && !searchTerm && selectedSortTerm === 'stars' && !filterMinStars && !filterMinCommitsYear && !filterPlatform && !filterLicense);

	// ── Hydrate state from URL on mount ──
	let initialized = false;
	onMount(() => {
		const params = $page.url.searchParams;
		searchTerm = params.get('search') ?? '';

		// Read sort from server-parsed data
		selectedSortTerm = data.sort;

		const order = params.get('order') as SortOrder | null;
		if (order && ['asc', 'desc'].includes(order)) {
			selectedSortOrder = order;
		}
		filterMinStars = params.get('minStars') ?? '';
		filterMinCommitsYear = params.get('minCommitsYear') ?? '';
		filterPlatform = params.get('platform') ?? '';
		filterLicense = params.get('license') ?? '';

		initialized = true;

		// If any filters are active from URL, re-fetch with them applied
		const hasFilters = searchTerm || filterMinStars || filterMinCommitsYear || filterPlatform || filterLicense
			|| selectedSortOrder !== 'desc';
		if (hasFilters) {
			fetchProjects();
		}
	});

	// Update projects when server data changes (category navigation)
	let prevCategory = $state('');
	$effect(() => {
		categoryStore.set(data.categories);
		// Reset client overrides so $derived falls back to fresh server data
		clientProjects = null;
		clientTotal = null;
		// Sync sort from server data on navigation
		selectedSortTerm = data.sort;
		// Re-fetch with active filters only when the category actually changes
		if (initialized && category !== prevCategory) {
			prevCategory = category;
			fetchProjects();
		}
	});

	// ── Build path with sort slug ──
	function buildSortPath(cat: string, sort: SortTerm): string {
		const slug = sortTermToSlug(sort);
		const base = cat ? `/${cat}` : '';
		return slug ? `${base}/${slug}` : base || '/';
	}

	// ── Sync state to URL params ──
	function syncUrlParams() {
		const path = buildSortPath(category, selectedSortTerm);
		const url = new URL(window.location.href);
		url.pathname = path;
		// Clear sort/order from query params — sort is now in the path
		url.searchParams.delete('sort');
		url.searchParams.delete('order');
		const defaults: Record<string, string> = {};
		const state: Record<string, string> = {
			search: searchTerm,
			minStars: filterMinStars,
			minCommitsYear: filterMinCommitsYear,
			platform: filterPlatform,
			license: filterLicense
		};
		for (const [key, value] of Object.entries(state)) {
			if (value && value !== (defaults[key] ?? '')) {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}
		replaceState(url, {});
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
		if (filterLicense) params.set('license', filterLicense);

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
				clientProjects = [...projects, ...result.projects];
			} else {
				clientProjects = result.projects;
			}
			clientTotal = result.total;
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
			if (initialized) {
				const path = buildSortPath(category, selectedSortTerm);
				goto(path);
			}
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
		const slug = sortTermToSlug(selectedSortTerm);
		const path = slug ? `/${value}/${slug}` : `/${value}`;
		goto(path);
	};

	const baseTitle = 'awwesome selfhosted';
	const baseDescription =
		'Find the most awesome open-source, self-hostable projects on the web. Original data by the awesome-selfhosted community, licensed under CC-BY-SA 3.0.';

	const sortItems: { value: string; label: string }[] = [
		{ value: 'stars', label: 'Most Stars' },
		{ value: 'trendingAbsolute', label: 'Trending' },
		{ value: 'trending', label: 'Trending %' },
		{ value: 'commitsYear', label: 'Most Active' },
		{ value: 'firstAdded', label: 'Recently Added' }
	];

	const sortLabels: Record<SortTerm, string> = {
		stars: '',
		trending: 'Trending %',
		trendingAbsolute: 'Trending',
		commitsYear: 'Most Active',
		firstAdded: 'Recently Added'
	};
	const sortDescriptions: Record<SortTerm, string> = {
		stars: '',
		trending: 'trending by relative growth',
		trendingAbsolute: 'trending',
		commitsYear: 'most active',
		firstAdded: 'recently added'
	};

	let categoryLabel = $derived(
		category
			? category
					.split('/')
					.map((c) => data.categories.names[c])
					.filter(Boolean)
					.join(' - ')
			: ''
	);
	let sortLabel = $derived(sortLabels[selectedSortTerm]);
	let pageTitle = $derived.by(() => {
		const parts = [sortLabel, categoryLabel].filter(Boolean);
		return parts.length ? `${parts.join(' ')} - ${baseTitle}` : baseTitle;
	});
	let pageDescription = $derived.by(() => {
		const sortDesc = sortDescriptions[selectedSortTerm];
		if (categoryLabel && sortDesc) {
			return `Discover the ${sortDesc} self-hosted ${categoryLabel} projects. ${baseDescription}`;
		}
		if (categoryLabel) {
			return `Discover the best self-hosted ${categoryLabel} projects. ${baseDescription}`;
		}
		if (sortDesc) {
			return `Discover the ${sortDesc} self-hosted projects. ${baseDescription}`;
		}
		return baseDescription;
	});
	let pageUrl = $derived(
		category ? `https://www.awweso.me/${category}` : 'https://www.awweso.me'
	);
</script>

<SvelteSeo
	title={pageTitle}
	description={pageDescription}
	canonical={pageUrl}
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
		<aside class="w-80 shrink-0 hidden xl:block">
			<SearchInput bind:searchTerm onsearch={handleSearch} />
			<nav class="flex gap-1 flex-row flex-wrap lg:flex-col mt-4">
				<a
					href={sortSuffix ? sortSuffix : '/'}
					class="truncate max-w-full xl:max-w-full text-left text-sm px-3 py-1 rounded-full {selectedCategory ===
					''
						? 'bg-gray-200 dark:bg-gray-950'
						: ''}"
				>
					{allCategory.name}
				</a>
				{#each data.categories.tree as category}
					{#if category}
						<CategoryGroup {category} {selectedCategory} {sortSuffix} />
					{/if}
				{/each}
			</nav>
		</aside>
		<div class="w-full">
			<div class="flex justify-between items-center flex-wrap gap-4 mb-8 mt-2 xl:mt-0">
				<h2 class="font-bold text-xl">
					{selectedCategory
						? selectedCategory.split('/').map((category) => categoryNames[category]).join(' - ')
						: 'All Projects'}
					<span class="font-normal text-gray-400">({total})</span>
				</h2>
				<div class="flex items-center gap-4 flex-wrap">
					<div class="md:hidden">
						<Select.Root type="single" value={selectedSortTerm} onValueChange={(v) => { selectedSortTerm = v as SortTerm; }} items={sortItems}>
							<Select.Trigger
								class="rounded-full px-4 h-10 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm flex items-center justify-between gap-2"
							>
								{sortItems.find((i) => i.value === selectedSortTerm)?.label ?? 'Sort'}
								<svg class="w-4 h-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M6 9l6 6 6-6" />
								</svg>
							</Select.Trigger>
							<Select.Portal>
								<Select.Content
									class="z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-1 max-h-[300px] overflow-y-auto"
									sideOffset={4}
								>
									<Select.Viewport>
										{#each sortItems as item}
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
					</div>
					<ToggleGroup.Root type="single" bind:value={selectedSortTerm} class="text-sm hidden md:flex">
						<SortButton value="stars" rounded="left">
							Most Stars
						</SortButton>
						<SortButton value="trendingAbsolute" rounded="none">
							Trending
						</SortButton>
						<SortButton value="trending" rounded="none">
							Trending %
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
						licenses={data.licenses}
						bind:minStars={filterMinStars}
						bind:minCommitsYear={filterMinCommitsYear}
						bind:platform={filterPlatform}
						bind:license={filterLicense}
						onfilter={() => fetchProjects()}
					/>
					<a
						href={isDefaultView ? undefined : '/'}
						class="h-10 px-4 flex items-center rounded-full text-sm bg-gray-200 dark:bg-gray-800
							{isDefaultView ? 'opacity-40 cursor-default' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
						aria-disabled={isDefaultView}
					>
						Clear
					</a>
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
