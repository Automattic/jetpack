<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { isFatalError } from '../../../stores/critical-css-state';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import CriticalCssStatus from './CriticalCssStatus.svelte';
</script>

{#if $isFatalError}
	<CriticalCssShowStopperError supportLink="https://jetpackme.wordpress.com/contact-support/" />
{:else}
	<CriticalCssStatus
		generateText={__(
			'Jetpack Boost will generate Critical CSS for you automatically.',
			'jetpack-boost'
		)}
		generateMoreText={__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}
	/>
{/if}
