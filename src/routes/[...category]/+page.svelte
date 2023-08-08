<script lang="ts">
	import githubMark from '$lib/assets/github-mark.svg';
	import type { ProjectCollection } from '../../lib/types/types';
	import ProjectItem from '../../components/ProjectItem.svelte';
	import { allCategory } from '../../lib';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { removeTrailingSlashes } from '../../lib';
	export let data: ProjectCollection;

	let category = removeTrailingSlashes($page.params?.category);

	let selectedCategory = category ?? allCategory.slug;
	$: projects = [...data.projects].filter((project) => {
		if (selectedCategory === allCategory.slug) {
			return true;
		}
		return selectedCategory ? project.category?.slug === selectedCategory : true;
	});

	let displayLimit = 20;
	$: limitedProjects = projects.slice(0, displayLimit);

	const setSelectCategory = () => {
		if (selectedCategory === '') {
			console.log(selectedCategory);
			goto('/');
			return;
		}
		goto(`/${selectedCategory}`);
	};
	const setCategory = (categorySlug) => {
		selectedCategory = categorySlug
		goto(`/${categorySlug}`);
	};
</script>

<div class="flex flex-col gap-4 mx-auto my-8 p-4">
	<div class="flex justify-between">
		<h1 class="text-3xl font-bold mb-4">Awwesome Selfhosted</h1>
		<a href="https://github.com/mkitzmann/selfhosted-db"
			><img src={githubMark} alt="Github repo" class="h-8" /></a
		>
	</div>
	<div class="flex flex-col xl:flex-row gap-8">
		<select
			bind:value={selectedCategory}
			on:change={setSelectCategory}
			class="rounded-full px-4 py-2 xl:hidden"
		>
			{#each data.categories as category}
				{#if category}
					<option value={category.slug}>
						{category.name}
					</option>
				{/if}
			{/each}
		</select>
		<div class="max-w-[20%] hidden xl:block">
			<div class="flex gap-1 flex-row flex-wrap lg:flex-col">
				{#each data.categories as category}
					{#if category}
						<a
							href="/{category?.slug}"
							class="truncate max-w-full xl:max-w-full text-left text-sm px-2 py-1 rounded-full
							{selectedCategory === category.slug ? 'bg-gray-200' : ''}"
							on:click={setCategory(category.slug)}
						>
							{category.name}
						</a>
					{/if}
				{/each}
			</div>
		</div>
		<div class="w-full">
			<div class="flex justify-between flex-wrap gap-4">
				<h2 class="font-bold text-xl">
					{data.categories.find((category) => category.slug === selectedCategory).name}
				</h2>
				<div class="text-sm mb-4 text-right">
					{projects.length} Projects
				</div>
			</div>
			<div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
				{#each limitedProjects as project}
					<ProjectItem {project} on:change={setCategory(project.category.slug)} />
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
