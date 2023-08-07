<script lang="ts">
	import githubMark from '$lib/assets/github-mark.svg';
	import type { ProjectCollection } from '../lib/types/types';
		import ProjectItem from "../components/ProjectItem.svelte";
	export let data: ProjectCollection;
	// import slugify from '@sindresorhus/slugify';


	let allCategory = 'All';
	let selectedCategory;
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
	<div class="flex flex-col lg:flex-row gap-8">
		<div class="lg:min-w-fit lg:overflow-y-scroll">
			<div class="flex gap-1 flex-row flex-wrap lg:flex-col">
				{#each categories as category}
					<button
						class="truncate max-w-80 xl:max-w-full text-left text-sm px-2 py-1 rounded-full bg-gray-100 lg:bg-transparent {selectedCategory ===
						category
							? 'bg-gray-200'
							: ''}"
						on:click={setCategory(category)}
					>
						{category}
					</button>
				{/each}
			</div>
		</div>
		<div>
			<div>
				{#if selectedCategory}
					<h2 class="font-bold text-xl">{selectedCategory}</h2>
				{/if}
				<div class="text-sm mb-4 text-right">
					Count: {projects.length}
				</div>
			</div>
			<div class="grid lg:grid-cols-2 2xl:grid-cols-3 gap-4">
				{#each projects as project}
					<ProjectItem project="{project}" on:set-category={setCategory(project.category)} />
				{/each}
			</div>
		</div>
	</div>
</div>
