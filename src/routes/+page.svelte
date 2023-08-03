<script lang="ts">
	import star from '$lib/assets/star.svg';
	import type { ProjectCollection } from '../lib/types/types';
	export let data: ProjectCollection;

	let allCategory = 'All';
	let selectedCategory;
	$: categories = [allCategory].concat([
		...new Set(Object.values(data).map((project) => project.category))
	]);
	$: projects = Object.values(data)
		.filter((project) => {
			if (selectedCategory === allCategory) {
				return true;
			}
			return selectedCategory ? project.category === selectedCategory : true;
		})
		.sort((a, b) => (a.stars < b.stars ? 1 : 0));
</script>

<div class="flex flex-col gap-4 max-w-4xl mx-auto my-8 p-4">
	<div class="flex gap-2 flex-wrap">
		{#each categories as category}
			<button
				class="text-sm rounded-full inline px-2 py-1 {selectedCategory === category
					? 'bg-gray-200'
					: 'bg-gray-100'}"
				on:click={() => (selectedCategory === category ? selectedCategory = allCategory : selectedCategory = category)}
				>{category}
			</button>
		{/each}
	</div>
	<div class="text-sm mt-4">
	Selected Projects: {projects.length}
	</div>
	{#each projects as project}
		<article class="bg-white p-4 rounded-xl flex flex-col gap-4">
			<a href={project.source_url} class="hover:text-blue-600">
				<h2 class="text-3xl font-bold">{project.name}</h2>
			</a>
			<div>{project.description}</div>
			<div class="flex">
				<button
						class="text-sm rounded-full inline px-2 py-1 bg-gray-100"
						on:click={() => (selectedCategory === project.category ? selectedCategory = allCategory : selectedCategory = project.category)}
				>{project.category}
				</button>
			</div>
			<div class="flex items-center gap-2 text-yellow-600">
				<img src={star} alt="star" class="h-6" />{project.stars}
			</div>
		</article>
	{/each}
</div>
