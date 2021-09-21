<!--
	This Component shows a span with the given time (Date) as a relative time in
	the past. Mouseover to show the exact time.
-->
<script>
	import { readable } from 'svelte/store';
	import describeTimeAgo from '../utils/describe-time-ago.ts';

	export let time;

	const label = readable( describeTimeAgo( time ), set => {
		// Update label every 10 seconds.
		const interval = setInterval( () => {
			set( describeTimeAgo( time ) );
		}, 10000 );

		// Clear interval on store cleanup.
		return () => clearInterval( interval );
	} );
</script>

<span title={time.toLocaleString()} class="time-ago">
	{$label}
</span>
