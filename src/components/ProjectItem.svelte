<script lang="ts">
	import type { Project } from '../lib/types/types';
	import { createEventDispatcher } from 'svelte';
	import numeral from 'numeral';
	import Star from './Star.svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import CommitGraph from './CommitGraph.svelte';

	dayjs.extend(relativeTime);
	const getRelativeTime = (date: Date) => dayjs(date).fromNow();

	export let project: Project;
</script>

<article class="max-w-full bg-white p-4 rounded-xl flex flex-col gap-4 hover:shadow-lg">
	<a href={project.source_url ?? project.primary_url} class="flex gap-4 items-center">
		{#if project.avatar_url}
			<img src={project.avatar_url} alt="{project.name} Avatar" class="h-8 w-8 rounded-full" />
		{/if}
		<h2 class="text-3xl font-bold break-all">{project.name}</h2>
	</a>
	{#if project.last_commit}
		<div class="text-sm text-gray-500">
			last commit {getRelativeTime(project.last_commit)}
		</div>
	{/if}
	<div>{@html project.description}</div>
	<div class="flex mt-auto gap-2 flex-wrap">
		{#each project.category as category, index}
			<a href="/{project.category.slice(0, index+1).map(item => item.slug).join('/')}" class="text-sm rounded-full px-2 py-1 bg-gray-100 max-w-full" >
				{category.name}
			</a>
		{/each}
	</div>

	{#if project.stars}
		<div class="flex items-center gap-2 text-yellow-600">
			<Star />{numeral(project.stars).format('0,0a')}
		</div>
	{/if}
	{#if project.commit_history}
		<div class="flex">
			<CommitGraph commits={project.commit_history} />
		</div>
	{/if}
</article>
