<script lang="ts">
	import type { Project } from '../lib/types/types';
	// import { createEventDispatcher } from 'svelte';
	import numeral from 'numeral';
	import Star from './Star.svelte';
	// import dayjs from 'dayjs';
	// import relativeTime from 'dayjs/plugin/relativeTime';
	import CommitGraph from './CommitGraph.svelte';
	import { categoryStore } from '../stores/stores';

	// dayjs.extend(relativeTime);
	// const getRelativeTime = (date: Date) => dayjs(date).fromNow();

	export let project: Project;

	$: categories = project.category?.split('/').slice(1) ?? [];

	let categoryNames;

	categoryStore.subscribe((value) => {
		categoryNames = value.names;
	});
</script>

<article class="max-w-full bg-white p-6 rounded-xl flex flex-col gap-4 hover:shadow-lg">
	<div class="flex gap-2 flex-wrap -mb-4 items-center">
		{#each categories as category, index}
			<a
				href={project.category
					.split('/')
					.slice(0, index + 2)
					.join('/')}
				class="text-xs text-gray-500 max-w-full"
			>
				{categoryNames[category]}
			</a>
			{#if categories.length > (index + 1)}
				-
			{/if}
		{/each}
	</div>
	<a href={project.source_url ?? project.primary_url} class="flex gap-4 items-center">
		{#if project.avatar_url}
			<img src={project.avatar_url} alt="{project.name} Avatar" class="h-8 w-8 rounded-full" />
		{/if}
		<h2 class="text-3xl font-bold break-all">{project.name}</h2>
	</a>
	<!--{#if project.last_commit}-->
	<!--	<div class="text-sm text-gray-500">-->
	<!--		last commit {getRelativeTime(project.last_commit)}-->
	<!--	</div>-->
	<!--{/if}-->
	<div class="mb-auto">{@html project.description}</div>

	{#if project.topics}
		<div class="flex gap-2 flex-wrap">
			{#each project.topics as topic}
				<a href={topic.id} class="text-xs rounded-full px-2 py-1 bg-gray-100 max-w-full">
					{topic.name}
				</a>
			{/each}
		</div>
	{/if}

	<div class="flex gap-4 w-full justify-between">

	{#if project.stars}
		<div class="flex items-center gap-2 text-yellow-600">
			<Star />{numeral(project.stars).format('0,0a')}
		</div>
	{/if}

	{#if project.commit_history}
		<div class="flex w-1/2">
			<CommitGraph commits={project.commit_history} />
		</div>
	{/if}
	</div>
</article>
