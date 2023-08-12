<script lang="ts">
	import githubMark from '$lib/assets/github-mark.svg';
	import type { ProjectCollection } from '../../lib/types/types';
	import ProjectItem from '../../components/ProjectItem.svelte';
	import { page } from '$app/stores';
	import { removeTrailingSlashes } from '../../lib';
	import { categoryStore } from '../../stores/stores';
	import CategoryGroup from '../../components/CategoryGroup.svelte';
	import CategorySelect from '../../components/CategorySelect.svelte';
	import {allCategory} from "$lib";
		import {beforeUpdate} from "svelte";
		import {goto} from "$app/navigation";

	export let data: ProjectCollection;
	categoryStore.set(data.categories);

	$: category = removeTrailingSlashes($page.params?.category) ?? '';

	let selectedCategory = '';
	beforeUpdate(() => {
		selectedCategory = category
	})
	$: projects = data.projects;

	let displayLimit = 20;
	$: limitedProjects = projects.slice(0, displayLimit);

	let categoryNames;

	categoryStore.subscribe((value) => {
		categoryNames = value.names;
	});

	const setSelectedCategory = (event) => {
		console.log(event.detail)
			goto(`/${event.detail}`)
	}
</script>

<div class="flex flex-col gap-4 mx-auto my-8 p-4">
	<div class="flex justify-between">
		<div>
			<h1 class="text-3xl font-bold mb-4">Awwesome Selfhosted</h1>
			<div class="text-sm -mt-4 text-gray-400">
				updated {new Intl.DateTimeFormat('en-US').format(Date.now())}
			</div>
		</div>
		<a href="https://github.com/mkitzmann/awwesome">
			<img src={githubMark} alt="Github repo" class="h-8" />
		</a>
	</div>
	<div class="flex flex-col xl:flex-row gap-8">
		<div class="xl:hidden flex flex-wrap gap-4">
			<CategorySelect
				categories={data.categories.tree}
				{selectedCategory}
				on:change={setSelectedCategory}
			/>
		</div>
		<div class="max-w-[20%] hidden xl:block">
			<div class="flex gap-1 flex-row flex-wrap lg:flex-col">
				<a
					href="/"
					class="truncate max-w-full xl:max-w-full text-left text-sm px-2 py-1 rounded-full"
				>
					{allCategory.name}
				</a>
				{#each data.categories.tree as category}
					{#if category}
						<CategoryGroup {category} />
					{/if}
				{/each}
			</div>
		</div>
		<div class="w-full">
			<div class="flex justify-between flex-wrap gap-4">
				<h2 class="font-bold text-xl">
					{selectedCategory
						.split('/')
						.map((category) => categoryNames[category])
						.join(' - ')}
				</h2>
				<div class="text-sm mb-4 text-right">
					{projects.length} Projects
				</div>
			</div>
			<div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
				{#each limitedProjects as project}
					<ProjectItem {project} />
				{/each}
			</div>
			<div class="flex mt-8">
				{#if projects.length > displayLimit}
					<button
						on:click={() => (displayLimit += displayLimit)}
						class="mx-auto bg-blue-100 hover:bg-blue-200 rounded-full px-4 py-2">Show more</button
					>
				{/if}
			</div>
		</div>
	</div>
</div>
