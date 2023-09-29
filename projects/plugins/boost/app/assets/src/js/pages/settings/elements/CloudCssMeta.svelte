<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { CriticalCssState } from '../../../stores/critical-css-state-types';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import CriticalCssStatus from './CriticalCssStatus.svelte';

	export let cssState: CriticalCssState;
	export let isCloudCssAvailable: boolean;
	export let criticalCssProgress: number;
	export let issues: CriticalCssState[ 'providers' ] = [];
	export let isFatalError: boolean;
	export let primaryErrorSet;
	export let suggestRegenerate;
	export let regenerateCriticalCss;

	$: successCount = cssState.providers.filter( provider => provider.status === 'success' ).length;
</script>

{#if isFatalError}
	<CriticalCssShowStopperError
		supportLink="https://jetpackme.wordpress.com/contact-support/"
		status={cssState.status}
		{primaryErrorSet}
		statusError={cssState.status_error}
		{regenerateCriticalCss}
	/>
{:else}
	<CriticalCssStatus
		{isCloudCssAvailable}
		status={cssState.status}
		{successCount}
		{issues}
		updated={cssState.updated}
		progress={criticalCssProgress}
		{suggestRegenerate}
		generateText={__(
			'Jetpack Boost will generate Critical CSS for you automatically.',
			'jetpack-boost'
		)}
		generateMoreText={__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}
	/>
{/if}
