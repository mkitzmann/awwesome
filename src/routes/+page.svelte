<script>
	/** @type {import('./$types').PageServerData} */
	export let data;
</script>


{#each data.repos as { repo }}

	<article class="bg-black text-white">
		<h2 class="text-3xl font-bold underline">{repo.name}</h2>
		<div>{repo.url}</div>
		<div>{repo.description}</div>
		<div>{repo.stargazers.totalCount}</div>
	</article>

{/each}
