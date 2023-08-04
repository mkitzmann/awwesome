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

<div class="flex flex-col gap-4 mx-auto my-8 p-4 max-w-screen-2xl">
	<h1 class="text-3xl font-bold mb-4">Selfhosted DB</h1>
	<div class="flex flex-col lg:flex-row gap-8">
		<div class="min-w-fit">
			<div class="flex gap-1 flex-row flex-wrap lg:flex-col">
				{#each categories as category}
					<button
						class="text-left text-sm px-2 py-1 rounded-full {selectedCategory === category
							? 'bg-gray-200'
							: ''}"
						on:click={() =>
							selectedCategory === category
								? (selectedCategory = allCategory)
								: (selectedCategory = category)}
						>{category}
					</button>
				{/each}
			</div>
		</div>
		<div>
			<div class="text-sm mb-4 text-right">
				Selected Projects: {projects.length}
			</div>
			<div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
				{#each projects as project}
					<article class="bg-white p-4 rounded-xl flex flex-col gap-4">
						<a href={project.source_url} class="hover:text-blue-600">
							<h2 class="text-3xl font-bold">{project.name}</h2>
						</a>
						<div>{project.description}</div>
						<div class="flex mt-auto">
							<button
								class="text-sm rounded-full inline px-2 py-1 bg-gray-100"
								on:click={() =>
									selectedCategory === project.category
										? (selectedCategory = allCategory)
										: (selectedCategory = project.category)}
								>{project.category}
							</button>
						</div>
						<div class="flex items-center gap-2 text-yellow-600">
							<img src={star} alt="star" class="h-6" />{project.stars}
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>
</div>
