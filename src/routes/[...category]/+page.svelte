<script lang="ts">
	import type { ProjectCollection, SortOrder, SortTerm } from '../../lib/types/types';
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
	// $: projects = data.projects;
	let searchTerm = '';

	let selectedSortTerm: SortTerm = 'stars';
	let selectedSortOrder: SortOrder = 'desc';
	$: searchedProjects = data.projects
		.filter((project) => JSON.stringify(project).toLowerCase().includes(searchTerm.toLowerCase()))
		.sort((projectA, projectB) => {
			const getValue = (project) => {
				const value = project[selectedSortTerm];
				return selectedSortTerm === 'createdAt' ? (value ? value.getTime() : 0) : value;
			};

			const valueA = getValue(projectA);
			const valueB = getValue(projectB);

			return selectedSortOrder === 'desc' ? valueB - valueA : valueA - valueB;
		});

	let displayLimit = 20;
	$: limitedProjects = searchedProjects.slice(0, displayLimit);

	let categoryNames;

	categoryStore.subscribe((value) => {
		categoryNames = value.names;
	});

	const setSelectedCategory = (event) => {
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
			<SearchInput bind:searchTerm />
			<CategorySelect
				categories={data.categories.tree}
				{selectedCategory}
				on:change={setSelectedCategory}
			/>
		</div>
		<aside class="max-w-[20%] hidden xl:block">
			<SearchInput bind:searchTerm />
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
						<SortButton bind:selectedSortTerm sortTerm="createdAt" rounded="right">
							Recently Created
						</SortButton>
					</div>
					<div class="text-sm text-right">
						{searchedProjects.length} Projects
					</div>
				</div>
			</div>
			<div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
				{#each limitedProjects as project}
					<ProjectItem {project} />
				{/each}
			</div>
			<div class="flex mt-8">
				{#if searchedProjects.length > displayLimit}
					<button
						on:click={() => (displayLimit += 20)}
						class="mx-auto bg-blue-100 dark:bg-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full px-4 py-2"
					>
						Show more
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
