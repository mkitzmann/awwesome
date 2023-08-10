<script lang="ts">
	export let commits;
	$: max = Math.max(...Object.values(commits).map(commit => commit.totalCount))
	$: points = Object.values(commits).reduce((prev, current, index) => {
		return `${prev} ${index * 10},${(current.totalCount / max) * 10}`;
	}, '');
</script>

<svg viewBox="0 0 110 20" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="grad1" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="20">
			<stop offset="0%" stop-color="#9be9a8"></stop>
			<stop offset="10%" stop-color="#40c463"></stop>
			<stop offset="25%" stop-color="#30a14e"></stop>
			<stop offset="50%" stop-color="#216e39"></stop>
		</linearGradient>
	</defs>
	<polyline
			vector-effect="non-scaling-stroke"
		transform="translate(0, 18) scale(1,-1)"
		{points}
		fill="transparent"
		stroke="url(#grad1)"
		stroke-width="2"
	/>
</svg>
