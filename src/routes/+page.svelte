<script>
	/** @type {import('./$types').PageServerData} */
	export let data;
</script>


{#each data.repos as { repo }}

	<article>
		<h2>{repo.name}</h2>
		<div>{repo.url}</div>
		<div>{repo.description}</div>
		<div>{repo.stargazers.totalCount}</div>
	</article>

{/each}
