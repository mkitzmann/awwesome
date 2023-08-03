<script lang="ts">
	import star from '$lib/assets/star.svg';
	import type {ProjectCollection} from "../lib/types/types";
	export let data: ProjectCollection;

	let selectedCategory
	$: categories = [...new Set(Object.values(data).map(project => project.category))]
	$: projects = Object.values(data).filter(project => selectedCategory ? project.category === selectedCategory : true)
</script>


<div class="flex flex-col gap-4 max-w-4xl mx-auto my-8 p-4">
	<div class="flex">
	{#each categories as category}
		<div class="text-sm bg-gray-100 rounded-full inline px-2 py-1">{category}</div>
	{/each}
	</div>
	{#each projects as project}
		<article class="bg-white p-4 rounded-xl flex flex-col gap-4">
			<a href={project.source_url} class="hover:text-blue-600">
				<h2 class="text-3xl font-bold">{project.name}</h2>
			</a>
			<div>{project.description}</div>
			<div class="flex">

			<div class="text-sm bg-gray-100 rounded-full inline px-2 py-1">{project.category}</div>
			</div>
			<div class="flex items-center gap-2 text-yellow-600">
				<img src={star} alt="star" class="h-6" />{project.stars}
			</div>
		</article>
	{/each}
</div>
