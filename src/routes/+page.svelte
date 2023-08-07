<script lang="ts">
	import githubMark from '$lib/assets/github-mark.svg';
	import type { ProjectCollection } from '../lib/types/types';
	import ProjectItem from '../components/ProjectItem.svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	export let data: ProjectCollection;
	// import slugify from '@sindresorhus/slugify';

	let allCategory = 'All';
	let selectedCategory = allCategory;
	$: categories = [allCategory]
		.concat([...new Set(data.projects.map((project) => project.category))])
		.sort();
	$: projects = data.projects.filter((project) => {
		if (selectedCategory === allCategory) {
			return true;
		}
		return selectedCategory ? project.category === selectedCategory : true;
	});

	const setCategory = (category) => {
		console.log(category);
		selectedCategory === category
			? (selectedCategory = allCategory)
			: (selectedCategory = category);
	};

	// const slugCategory = (input) => {
	// 	if (!input) {
	// 		return '';
	// 	}
	// 	return slugify(input.toString());
	// };
</script>

<div class="flex flex-col gap-4 mx-auto my-8 p-4">
	<div class="flex justify-between">
		<h1 class="text-3xl font-bold mb-4">Awwesome Selfhosted</h1>
		<a href="https://github.com/mkitzmann/selfhosted-db"
			><img src={githubMark} alt="Github repo" class="h-8" /></a
		>
	</div>
	<div class="flex flex-col xl:flex-row gap-8">
		<select bind:value={selectedCategory} class="rounded-full px-4 py-2 xl:hidden">
			{#each categories as category}
				<option value={category}>
					{category}
				</option>
			{/each}
		</select>
		<div class="max-w-[20%] hidden xl:block">
			<div class="flex gap-1 flex-row flex-wrap lg:flex-col">
				{#each categories as category}
					<button
						class="truncate max-w-full xl:max-w-full text-left text-sm px-2 py-1 rounded-full
						{selectedCategory === category ? 'bg-gray-200' : ''}"
						on:click={setCategory(category)}
					>
						{category}
					</button>
				{/each}
			</div>
		</div>
		<div>
			<div class="flex justify-between flex-wrap gap-4">
				<h2 class="font-bold text-xl">{selectedCategory}</h2>
				<div class="text-sm mb-4 text-right">
					{projects.length} Projects
				</div>
			</div>
			<div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
				{#each projects as project}
					<ProjectItem {project} on:set-category={setCategory(project.category)} />
				{/each}
			</div>
		</div>
	</div>
</div>
