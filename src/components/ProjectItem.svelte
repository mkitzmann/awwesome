<script lang="ts">
	import star from '$lib/assets/star.svg';
	import dayjs from 'dayjs';
	dayjs.extend(relativeTime);
	import relativeTime from 'dayjs/plugin/relativeTime';
	import type { Project } from '../lib/types/types';
	import { createEventDispatcher } from 'svelte';
	import numeral from 'numeral';

	export let project: Project;

	const dispatch = createEventDispatcher();

	dayjs.extend(relativeTime);
	const getRelativeTime = (date: Date) => dayjs(date).fromNow();

	function setCategory() {
		dispatch('set-category', project.category);
	}
</script>
<a href={project.source_url ?? project.primary_url} class="bg-white p-4 rounded-xl flex flex-col gap-4 hover:shadow-lg">
	<div class="flex gap-4 items-center">
		{#if project.avatar_url}
			<img src={project.avatar_url} alt="{project.name} Avatar" class="h-8 w-8 rounded-full" />
		{/if}
		<h2 class="text-3xl font-bold">{project.name}</h2>
	</div>
	{#if project.last_commit}
		<div class="text-sm text-gray-500">
			last commit {getRelativeTime(project.last_commit)}
		</div>
	{/if}
	<div>{@html project.description}</div>
	<div class="flex mt-auto">
		<button
			class="text-sm rounded-full inline px-2 py-1 bg-gray-100 truncate"
			on:click={setCategory}
			>{project.category}
		</button>
	</div>

	{#if project.stars}
		<div class="flex items-center gap-2 text-yellow-600">
			<img src={star} alt="star" class="h-6" />{numeral(project.stars).format('0,0a')}
		</div>
	{/if}
</a>
