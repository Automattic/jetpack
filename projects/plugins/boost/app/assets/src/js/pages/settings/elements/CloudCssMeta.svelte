<script>
	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';

	/**
	 * Internal dependencies
	 */
	import CriticalCssStatus from './CriticalCssStatus.svelte';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import { showError } from '../../../stores/critical-css-status';
	import { requestCloudCss } from '../../../utils/cloud-css';
</script>

{#if $showError}
	<CriticalCssShowStopperError on:retry={requestCloudCss} />
{:else}
	<CriticalCssStatus
		on:retry={requestCloudCss}
		generateText={__(
			'Jetpack Boost will generate Critical CSS for you automatically.',
			'jetpack-boost'
		)}
		generateMoreText={__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}
	/>
{/if}
