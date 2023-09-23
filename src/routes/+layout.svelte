<script>
	import '../app.postcss';
	import SvelteSeo from 'svelte-seo';
	import Logo from '../components/Logo.svelte';
	import githubMark from '$lib/assets/github-mark.svg';
</script>

<SvelteSeo
	title="Awwesome Selfhosted"
	description="Find the most awesome open-source, self-hostable projects on the web. Original data by the awesome-selfhosted community, licensed under CC-BY-SA 3.0."
/>

<div class="flex flex-col gap-4 mx-auto my-4 p-4">
	<div class="flex justify-between flex-wrap gap-2">
		<a href="/">
			<div class="flex gap-4 items-center mb-4">
				<Logo />
				<h1 class="text-2xl md:text-3xl font-bold">Awwesome Selfhosted</h1>
			</div>
		</a>
		<a
			href="https://github.com/mkitzmann/awwesome"
			class="flex-shrink-0 flex items-center gap-2 bg-gray-100 px-4 h-10 rounded-full hover:bg-yellow-400"
		>
			Star on Github <img src={githubMark} alt="Github repo" class="h-6" />
		</a>
	</div>
</div>
<slot />
