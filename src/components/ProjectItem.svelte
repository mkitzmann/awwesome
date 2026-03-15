<script lang="ts">
	import numeral from 'numeral';
	import Star from './Star.svelte';
	import dayjs from '$lib/dayjs';
	import CommitGraph from './CommitGraph.svelte';
	import { categoryStore } from '../stores/stores';
	import type { Project } from '../lib/types/types';
	import { appConfig } from '../lib/createConfig';
	import { sanitize } from '$lib/sanitize';
	import { onDestroy } from 'svelte';

	const getRelativeTime = (date: Date) => dayjs(date).fromNow();

	let { project }: { project: Project } = $props();

	let categories = $derived(project.category?.split('/').slice(1) ?? []);
	let iconUrl = $derived(project.avatar_url ?? deriveOwnerIcon(project.source_url));

	function deriveOwnerIcon(url: string | null | undefined): string | null {
		const match = url?.match(/github\.com\/([^/]+)/);
		return match ? `https://github.com/${match[1]}.png?size=64` : null;
	}

	let categoryNames: Record<string, string> = $state({});

	const unsubscribeCategory = categoryStore.subscribe((value) => {
		categoryNames = value.names;
	});
	onDestroy(unsubscribeCategory);

	let license = $derived(project.license?.nickname ?? project.license?.name);
	let licenseWithSuffix = $derived(license === 'Other' ? `${license} License` : license);
	let commitVals = $derived(project?.commit_history ? Object.values(project.commit_history) : []);
	let totalCommits = $derived(commitVals.length > 0 ? commitVals.reduce((prev, current) => prev + current, 0) : 0);
</script>

<article
	class="max-w-full bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl flex flex-col gap-4 hover:shadow-lg"
	class:opacity-60={project.archived}
>
	{#if project.archived}
		<div class="text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-lg px-3 py-2">
			This project is archived and no longer maintained.
		</div>
	{/if}
	<div class="flex gap-2 flex-wrap -mb-1 items-center">
		{#if categories.length > 0}
			{#each categories as category, index}
				<a
					href={(project.category ?? '')
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
		{#if iconUrl}
			<img src={iconUrl} alt="{project.name} Avatar" class="h-8 w-8 rounded-full" />
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
		{#if project.demo_url}
			<span class="mx-1">·</span>
			<a href={project.demo_url} target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline inline">
				Demo
			</a>
		{/if}
	</div>
	{#if project.description}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized with DOMPurify -->
		<div class="break-words">{@html sanitize(project.description)}</div>
	{/if}

	<div class="mb-auto">
		<div class="flex gap-2 flex-wrap">
			{#each project.platforms ?? [] as platform}
				<a
					href="?platform={platform}"
					target="_self"
					class="text-xs rounded-full px-2 py-1 bg-blue-100 dark:bg-blue-900 max-w-full"
				>
					{platform}
				</a>
			{/each}
			{#each project.topics ?? [] as topic}
				<a
					href={topic.path}
					class="text-xs rounded-full px-2 py-1 bg-gray-100 dark:bg-gray-900 max-w-full"
				>
					{topic.name}
				</a>
			{/each}
		</div>
	</div>
	<div class="flex flex-col min-[460px]:flex-row sm:gap-6 w-full justify-between sm:items-end">
		<div class="flex flex-col gap-2">
			{#if project.stars}
				<div class="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 -mb-2">
					<Star />{numeral(project.stars).format('0,0a')}
					{#if project.trendingDelta != null}
						<span class="text-sm {project.trendingDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}">{project.trendingDelta > 0 ? '+' : ''}{numeral(project.trendingDelta).format('0,0')}</span>
					{/if}
				</div>
			{/if}
			{#if project.firstAdded}
				<div class="text-sm text-gray-500">
					added {getRelativeTime(project.firstAdded)}
				</div>
			{/if}
		</div>

		{#if project.commit_history && Object.keys(project.commit_history).length > 0}
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
				<CommitGraph commits={project.commit_history} id={project.primary_url ?? ''} />
			</div>
		{/if}
	</div>
</article>
