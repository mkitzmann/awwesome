<script lang="ts">
	import githubMark from '$lib/assets/github-mark.svg';
	import type { Category, ProjectCollection } from '../../lib/types/types';
	import ProjectItem from '../../components/ProjectItem.svelte';
	import { allCategory } from '../../lib';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { removeTrailingSlashes } from '../../lib';
	import CategoryLink from '../../components/CategoryLink.svelte';
	export let data: ProjectCollection;

	let category = removeTrailingSlashes($page.params?.category)?.split('/');
	console.log(category)

	let selectedCategory: Category[] = category ?? [allCategory.slug];
	$: projects = [...data.projects]
	//   .filter((project) => {
	// 	if (selectedCategory === allCategory.slug) {
	// 		return true;
	// 	}
	// 	// console.log(project.category?.map(item => item.slug), category, project.category?.map(item => item.slug) === category)
	// 	// return selectedCategory ? project.category?.slug === selectedCategory : true;
	//   // const array1 = project.category?.map(item => item.slug)
	//   // const array2 = category
	//   // if (array1.length === array2.length && array1.every((value, index) => value === array2[index]))
	// 	for (const categoryItem of category) {
	//
	// 	}
	// 	return true;
	// });

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
	const setCategory = (category: Category[]) => {
		selectedCategory = category;
		goto(`/${category.join('/')}`);
	};
</script>

<div class="flex flex-col gap-4 mx-auto my-8 p-4">
	<div class="flex justify-between">
		<div>
			<h1 class="text-3xl font-bold mb-4">Awwesome Selfhosted</h1>
			<div class="text-sm -mt-4 text-gray-400">
				updated {new Intl.DateTimeFormat('en-US').format(Date.now())}
			</div>
		</div>
		<a href="https://github.com/mkitzmann/awwesome"
			><img src={githubMark} alt="Github repo" class="h-8" /></a
		>
	</div>
	<div class="flex flex-col xl:flex-row gap-8">
		<!--		<select-->
		<!--			bind:value={selectedCategory}-->
		<!--			on:change={setSelectCategory}-->
		<!--			class="rounded-full px-4 py-2 xl:hidden"-->
		<!--		>-->
		<!--			{#each data.categories as category}-->
		<!--				{#if category}-->
		<!--					<option value={category.slug}>-->
		<!--						{category.name}-->
		<!--					</option>-->
		<!--				{/if}-->
		<!--			{/each}-->
		<!--		</select>-->
		<div class="max-w-[20%] hidden xl:block">
			<div class="flex gap-1 flex-row flex-wrap lg:flex-col">
				{#each data.categories as category}
					{#if category}
						<CategoryLink href="/{category.slug}" name="{category.name}"/>
						{#each category.children as category2}
							<div class="ml-4">
								<CategoryLink  href="{`/${category.slug}/${category2.slug}`}" name="{category2.name}" />
								{#each category2.children as category3}
									<div class="ml-4">
										<CategoryLink href="{`/${category.slug}/${category2.slug}/${category3.slug}`}" name="{category3.name}" />
									</div>
								{/each}
							</div>
						{/each}
					{/if}
				{/each}
			</div>
		</div>
		<div class="w-full">
			<div class="flex justify-between flex-wrap gap-4">
				<!--				<h2 class="font-bold text-xl">-->
				<!--					{data.categories.find((category) => category.slug === selectedCategory).name}-->
				<!--				</h2>-->
				<div class="text-sm mb-4 text-right">
					{projects.length} Projects
				</div>
			</div>
			<div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
				{#each limitedProjects as project}
					<ProjectItem {project} on:change={setCategory(project.category)} />
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
