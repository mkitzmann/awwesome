<script lang="ts">
	import star from '$lib/assets/star.svg';
	import githubMark from '$lib/assets/github-mark.svg';
	import type { ProjectCollection } from '../lib/types/types';
	export let data: ProjectCollection;
	import dayjs from 'dayjs';
	// import slugify from '@sindresorhus/slugify';

	import relativeTime from 'dayjs/plugin/relativeTime';

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

	const getRelativeTime = (date: Date) => dayjs(date).fromNow();

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
					<article class="bg-white p-4 rounded-xl flex flex-col gap-4">
						<div class="flex gap-4 items-center">
							{#if project.avatar_url}
								<img
									src={project.avatar_url}
									alt="{project.name} Avatar"
									class="h-8 w-8 rounded-full"
								/>
							{/if}
							<a href={project.source_url} class="hover:text-blue-600">
								<h2 class="text-3xl font-bold">{project.name}</h2>
							</a>
						</div>
						{#if project.last_commit}
							<div class="text-sm text-gray-600">
								last commit {getRelativeTime(project.last_commit)}
							</div>
						{/if}
						<div>{@html project.description}</div>
						<div class="flex mt-auto">
							<button
								class="text-sm rounded-full inline px-2 py-1 bg-gray-100 truncate"
								on:click={() =>
									selectedCategory === project.category
										? (selectedCategory = allCategory)
										: (selectedCategory = project.category)}
								>{project.category}
							</button>
						</div>

						{#if project.stars}
							<div class="flex items-center gap-2 text-yellow-600">
								<img src={star} alt="star" class="h-6" />{project.stars}
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</div>
	</div>
</div>
