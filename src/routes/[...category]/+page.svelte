<script lang="ts">
	import githubMark from '$lib/assets/github-mark.svg';
	import type { ProjectCollection } from '../../lib/types/types';
	import ProjectItem from '../../components/ProjectItem.svelte';
	import { allCategory } from '../../lib';
	import { page } from '$app/stores';
	import { removeTrailingSlashes } from '../../lib';
	import CategoryGroup from '../../components/CategoryGroup.svelte';
	import CategorySelect from "../../components/CategorySelect.svelte";
	export let data: ProjectCollection;

	let category = removeTrailingSlashes($page.params?.category)?.split('/') ?? [];

	$: selectedCategory = [...category] ?? [allCategory.slug];
	$: projects = data.projects;

	let displayLimit = 20;
	$: limitedProjects = projects.slice(0, displayLimit);
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
		<CategorySelect categories={data.categories}/>
		<div class="max-w-[20%] hidden xl:block">
			<div class="flex gap-1 flex-row flex-wrap lg:flex-col">
				{#each data.categories as category}
					{#if category}
						<CategoryGroup {category} />
					{/if}
				{/each}
			</div>
		</div>
		<div class="w-full">
			<div class="flex justify-between flex-wrap gap-4">
				<h2 class="font-bold text-xl">
					{selectedCategory}
					<!--{data.categories.find((category) => category.slug === selectedCategory).name}-->
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
