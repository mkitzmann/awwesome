<script lang="ts">
	import numeral from 'numeral';
	import Star from './Star.svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import CommitGraph from './CommitGraph.svelte';
	import { categoryStore } from '../stores/stores';
	import type { Project } from '../lib/types/types';

	dayjs.extend(relativeTime);
	const getRelativeTime = (date: Date) => dayjs(date).fromNow();

	export let project: Project;

	$: categories = project.category?.split('/').slice(1) ?? [];

	let categoryNames;

	categoryStore.subscribe((value) => {
		categoryNames = value.names;
	});

	$: license = project.license?.nickname ?? project.license?.name
	$: licenseWithSuffix = license === 'Other' ? `${license} License` : license
</script>

<article class="max-w-full bg-white p-4 md:p-6 rounded-xl flex flex-col gap-4 hover:shadow-lg">
	<div class="flex gap-2 flex-wrap -mb-1 items-center">
		{#each categories as category, index}
			<a
				href={project.category
					.split('/')
					.slice(0, index + 2)
					.join('/')}
				class="text-sm text-gray-500 max-w-full"
			>
				{categoryNames[category]}
			</a>
			{#if categories.length > index + 1}
				-
			{/if}
		{/each}
	</div>
	<a
		href={project.source_url ?? project.primary_url}
		target="_blank"
		class="flex gap-4 items-center"
	>
		{#if project.avatar_url}
			<img src={project.avatar_url} alt="{project.name} Avatar" class="h-8 w-8 rounded-full" />
		{/if}
		<h2 class="text-3xl font-bold break-all">{project.name}</h2>
	</a>
	<div class="text-sm text-gray-500">
		{#if project.pushedAt}
			last commit {getRelativeTime(project.pushedAt)},
		{/if}
		{#if project.license}
			<a href={project.license.url} class=" inline">
				{licenseWithSuffix}
			</a>
		{/if}
	</div>
	<div class="break-words">{@html project.description}</div>

	<div class="mb-auto">
		{#if project.topics}
			<div class="flex gap-2 flex-wrap">
				{#each project.topics as topic}
					<a
						href="https://github.com/topics/{topic.name}"
						target="_blank"
						class="text-xs rounded-full px-2 py-1 bg-gray-100 max-w-full"
					>
						{topic.name}
					</a>
				{/each}
			</div>
		{/if}
	</div>

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
