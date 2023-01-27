<!--
	This Component shows a span with the given time (Date) as a relative time in
	the past. Mouseover to show the exact time.
-->
<script lang="ts">
	import { getTimeAgoStore } from '../utils/describe-time-ago';

	export let time: Date;

	const label = getTimeAgoStore( time );
</script>

<span title={time.toLocaleString()} class="time-ago">
	{$label}
</span>
