<script lang="ts">
	import type { CommitCount } from '../lib/types/types';
	import { appConfig } from '../lib/createConfig';

	export let commits: CommitCount;
	export let id: string;
	$: vals = Object.values(commits);
	$: max = vals.length > 0 ? Math.max(...vals) : 0;
	$: points = vals.reduce((prev, current, index) => {
		return `${prev} ${index * 10},${(current / max) * 10}`;
	}, '');

	$: totalCommits = vals.length > 0 ? vals.reduce((prev, current) => prev + current, 0) : 0;

	$: topColor = totalCommits < appConfig.lowCommitCount ? '#944' : '#216e39';
	$: bottomColor = totalCommits < appConfig.lowCommitCount ? '#faa' : '#9be9a8';
</script>

<svg viewBox="0 0 110 20" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="grad{id}" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="10" y2="20">
			<stop offset="0%" stop-color={bottomColor} />
			<stop offset="60%" stop-color={topColor} />
		</linearGradient>
	</defs>
	<line x1="0" y1="8" x2="110" y2="8" class="stroke-gray-200" stroke-width="0.2" />
	<line x1="0" y1="18" x2="110" y2="18" class="stroke-gray-200" stroke-width="0.2" />
	<polyline
		vector-effect="non-scaling-stroke"
		transform="translate(0, 18) scale(1,-1)"
		{points}
		fill="transparent"
		stroke="url(#grad{id})"
		stroke-width="2"
	>
		<title>Past year of activity</title>
	</polyline>
</svg>
