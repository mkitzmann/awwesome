<script lang="ts">
	import slugify from '@sindresorhus/slugify';
	import type { Collection } from '../lib/types/types';

	export let data: { collections: Collection[] };
</script>

<div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
	{#each data.collections as collection}
		<article class="max-w-full bg-white p-4 md:p-6 rounded-xl flex flex-col gap-4 hover:shadow-lg">
			<a href={slugify(collection.name)} class="flex gap-4 items-center">
				<h2 class="text-3xl font-bold break-all">{collection.name}</h2>
			</a>
			{collection.projectCount} Projects
		</article>
	{/each}
</div>
