<script lang="ts">
	import type {CommitCount} from "../lib/types/types";

	export let commits: CommitCount;
	$: max = Math.max(...Object.values(commits));
	$: points = Object.values(commits).reduce((prev, current, index) => {
		return `${prev} ${index * 10},${(current / max) * 10}`;
	}, '');
</script>

<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="grad1" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="10" y2="20">
			<stop offset="0%" stop-color="#9be9a8" />
			<stop offset="10%" stop-color="#40c463" />
			<stop offset="25%" stop-color="#30a14e" />
			<stop offset="50%" stop-color="#216e39" />
		</linearGradient>
	</defs>
	<text fill="gray" xml:space="preserve" font-size="4" letter-spacing="0em"><tspan x="0" y="9.5">{max}</tspan></text>
	<line x1="10" y1="8" x2="120" y2="8" class="stroke-gray-200" stroke-width="0.2"></line>
	<line x1="10" y1="18" x2="120" y2="18" class="stroke-gray-200" stroke-width="0.2"></line>
	<polyline
		vector-effect="non-scaling-stroke"
		transform="translate(10, 18) scale(1,-1)"
		{points}
		fill="transparent"
		stroke="url(#grad1)"
		stroke-width="2"
	>
		<title>Past year of activity</title>
	</polyline>
</svg>

