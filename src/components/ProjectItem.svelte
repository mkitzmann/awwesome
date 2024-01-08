<script lang="ts">
	import numeral from 'numeral';
	import Star from './Star.svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import CommitGraph from './CommitGraph.svelte';
	import { categoryStore } from '../stores/stores';
	import type { Project } from '../lib/types/types';
	import { appConfig } from '../lib/createConfig';

	dayjs.extend(relativeTime);
	const getRelativeTime = (date: Date) => dayjs(date).fromNow();

	export let project: Project;

	$: categories = project.category?.split('/').slice(1) ?? [];

	let categoryNames;

	categoryStore.subscribe((value) => {
		categoryNames = value.names;
	});

	$: license = project.license?.nickname ?? project.license?.name;
	$: licenseWithSuffix = license === 'Other' ? `${license} License` : license;

	$: totalCommits = project?.commit_history
		? Object.values(project.commit_history).reduce((prev, current) => prev + current)
		: 0;
</script>

<article
	class="max-w-full bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl flex flex-col gap-4 hover:shadow-lg"
>
	<div class="flex gap-2 flex-wrap -mb-1 items-center">
		{#if categories.length > 0}
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
		{/if}
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
	{#if project.description}
		<div class="break-words">{@html project.description}</div>
	{/if}

	<div class="mb-auto">
		{#if project.topics}
			<div class="flex gap-2 flex-wrap">
				{#each project.topics as topic}
					<a
						href="?search={topic}"
						target="_self"
						class="text-xs rounded-full px-2 py-1 bg-gray-100 dark:bg-gray-900 max-w-full"
					>
						{topic}
					</a>
				{/each}
			</div>
		{/if}
	</div>
	<div class="flex flex-col min-[460px]:flex-row sm:gap-6 w-full justify-between sm:items-end">
		<div class="flex flex-col gap-2">
			{#if project.stars}
				<div class="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 -mb-2">
					<Star />{numeral(project.stars).format('0,0a')}
				</div>
			{/if}
			<div class="text-sm text-gray-500">
				created {getRelativeTime(project.createdAt)}
			</div>
		</div>

		{#if project.commit_history}
			<div class="flex flex-col items-end w-full min-[460px]:w-64">
				<div class="-mb-3">
					<span
						class="font-bold text-lg text-green-600"
						class:text-red-600={totalCommits < appConfig.lowCommitCount}
					>
						{numeral(totalCommits).format('0,0a')}
					</span>
					<span
						class="text-xs font-light text-green-600"
						class:text-red-600={totalCommits < appConfig.lowCommitCount}
					>
						commits past year
					</span>
				</div>
				<CommitGraph commits={project.commit_history} id={project.primary_url} />
			</div>
		{/if}
	</div>
</article>
