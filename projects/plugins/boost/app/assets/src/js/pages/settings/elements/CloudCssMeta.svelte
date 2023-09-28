<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import {
		criticalCssProgress,
		criticalCssState,
		isFatalError,
	} from '../../../stores/critical-css-state';
	import { criticalCssIssues, primaryErrorSet } from '../../../stores/critical-css-state-errors';
	import { suggestRegenerateDS } from '../../../stores/data-sync-client';
	import { modulesState } from '../../../stores/modules';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import CriticalCssStatus from './CriticalCssStatus.svelte';

	$: status = $criticalCssState.status;
	$: criticalCssStatusError = $criticalCssState.status_error;
	$: successCount = $criticalCssState.providers.filter(
		provider => provider.status === 'success'
	).length;
	$: updated = $criticalCssState.updated;
	$: isCloudCssAvailable = $modulesState.cloud_css?.available;
	$: issues = $criticalCssIssues;
	$: progress = $criticalCssProgress;
	$: suggestRegenerate = suggestRegenerateDS.store;
</script>

{#if $isFatalError}
	<CriticalCssShowStopperError
		supportLink="https://jetpackme.wordpress.com/contact-support/"
		{status}
		primaryErrorSet={$primaryErrorSet}
		statusError={criticalCssStatusError}
	/>
{:else}
	<CriticalCssStatus
		{isCloudCssAvailable}
		{status}
		{successCount}
		{issues}
		{updated}
		{progress}
		{suggestRegenerate}
		generateText={__(
			'Jetpack Boost will generate Critical CSS for you automatically.',
			'jetpack-boost'
		)}
		generateMoreText={__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}
	/>
{/if}
