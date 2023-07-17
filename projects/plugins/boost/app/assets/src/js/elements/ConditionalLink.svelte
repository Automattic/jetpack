<!-- Utility: Show a <Link> if a condition is met. Otherwise, just show the contents. -->
<script>
	import { recordBoostEvent } from '../utils/analytics';
	import { Link } from '../utils/router';

	export let isLink = true;
	export let trackEvent = '';
	export let trackEventProps = {};

	function handleClick() {
		if ( '' !== trackEvent ) {
			recordBoostEvent( trackEvent, trackEventProps );
		}
	}
</script>

{#if isLink}
	<Link on:click={handleClick} {...$$props}><slot /></Link>
{:else}
	<slot />
{/if}
