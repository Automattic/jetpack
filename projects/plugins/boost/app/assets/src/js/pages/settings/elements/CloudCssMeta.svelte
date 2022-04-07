<script>
	/**
	 * WordPress dependencies
	 */
	import { __, _n, sprintf } from '@wordpress/i18n';

	/**
	 * Internal dependencies
	 */
	import { requestCloudCss } from '../../../utils/cloud-css';
	import { criticalCssStatus } from '../../../stores/critical-css-status';
	import RefreshIcon from '../../../svg/refresh.svg';
	import TimeAgo from '../../../elements/TimeAgo.svelte';

	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';

	// Show an error if in error state, or if a success has 0 results.
	let showError = false;
	$: showError =
		$criticalCssStatus.status === 'error' ||
		( $criticalCssStatus.status === 'success' && $criticalCssStatus.success_count === 0 );
</script>

<div class="jb-cloud-css-meta">
	{#if showError}
		<CriticalCssShowStopperError on:retry={requestCloudCss} />
	{:else}
		<div class="meta-description">
			{#if $criticalCssStatus.success_count === 0}
				{__( 'Jetpack Boost will generate Critical CSS for you automatically.', 'jetpack-boost' )}
			{:else}
				{sprintf(
					/* translators: %d is a number of CSS Files which were successfully generated */
					_n(
						'%d file generated',
						'%d files generated',
						$criticalCssStatus.success_count,
						'jetpack-boost'
					),
					$criticalCssStatus.success_count
				)}
				<TimeAgo time={new Date( $criticalCssStatus.updated * 1000 )} />.
				{#if $criticalCssStatus.progress < 100}
					{__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}
				{/if}
			{/if}
		</div>
		<button type="button" class="components-button is-link" on:click={requestCloudCss}>
			<RefreshIcon />
			{__( 'Regenerate', 'jetpack-boost' )}
		</button>
	{/if}
</div>
