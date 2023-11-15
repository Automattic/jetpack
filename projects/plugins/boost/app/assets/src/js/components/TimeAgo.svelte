<!--
	This Component shows a span with the given time (Date) as a relative time in
	the past. Mouseover to show the exact time.
-->
<script lang="ts">
	import describeTimeAgo from '@lib/utils/describe-time-ago';
	import { onMount } from 'svelte';

	export let time: Date;

	let label = describeTimeAgo( time );

	let interval;

	onMount( () => {
		// Update label every 10 seconds.
		interval = setInterval( () => {
			label = describeTimeAgo( time );
		}, 10000 );

		// Clear interval on destroy.
		return () => clearInterval( interval );
	} );
</script>

<span title={time.toLocaleString()} class="time-ago">
	{label}
</span>
