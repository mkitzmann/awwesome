<script lang="ts">
	import githubMark from '$lib/assets/github-mark.svg';
	import type { ProjectCollection } from '../../lib/types/types';
	import ProjectItem from '../../components/ProjectItem.svelte';
	import { page } from '$app/stores';
	import { removeTrailingSlashes } from '../../lib';
	import { categoryStore } from '../../stores/stores';
	import CategoryGroup from '../../components/CategoryGroup.svelte';
	import CategorySelect from '../../components/CategorySelect.svelte';
	import { allCategory } from '$lib';
	import { beforeUpdate } from 'svelte';
	import { goto } from '$app/navigation';
	import Logo from '../../components/Logo.svelte';
	import SearchInput from '../../components/SearchInput.svelte';

	export let data: ProjectCollection;
	categoryStore.set(data.categories);

	$: category = removeTrailingSlashes($page.params?.category) ?? '';

	let selectedCategory = '';
	beforeUpdate(() => {
		selectedCategory = category;
	});
	$: projects = data.projects;
	let searchTerm = '';
	$: searchedProjects = data.projects.filter((project) =>
		JSON.stringify(project).toLowerCase().includes(searchTerm.toLowerCase())
	);

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
		<a href="/">
			<div class="flex gap-4 items-center mb-4">
				<Logo />
				<h1 class="text-3xl font-bold">Awwesome Selfhosted</h1>
			</div>
			<!--			<div class="text-sm -mt-4 text-gray-400">-->
			<!--				updated {new Intl.DateTimeFormat('en-US').format(Date.now())}-->
			<!--			</div>-->
		</a>
		<a
			href="https://github.com/mkitzmann/awwesome"
			class="flex-shrink-0 flex items-center gap-2 bg-gray-100 px-4 h-10 rounded-full hover:bg-yellow-400"
		>
			Star on Github <img src={githubMark} alt="Github repo" class="h-6" />
		</a>
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
						? 'bg-gray-200'
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
				<div class="text-sm text-right">
					{searchedProjects.length} Projects
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
						class="mx-auto bg-blue-100 hover:bg-blue-200 rounded-full px-4 py-2"
					>
						Show more
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
