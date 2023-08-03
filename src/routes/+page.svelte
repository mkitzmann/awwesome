<script>
	import star from '$lib/assets/star.svg';
	/** @type {import('./$types').PageServerData} */
	export let data;
</script>

<div class="flex flex-col gap-4 max-w-4xl mx-auto my-8">
	{#each data.repos as { repo }}
		<article class="bg-white p-4 mx-4 rounded-xl flex flex-col gap-4">
			<a href={repo.url} class="hover:text-blue-600">
				<h2 class="text-3xl font-bold">{repo.name}</h2>
			</a>
			<div>{repo.description}</div>
			<div class="flex items-center gap-2 text-yellow-600">
				<img src={star} alt="star" class="h-6" />{repo.stargazers.totalCount}
			</div>
		</article>
	{/each}
</div>
