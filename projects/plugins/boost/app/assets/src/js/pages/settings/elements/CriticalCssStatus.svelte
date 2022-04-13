<script>
	/**
	 * WordPress dependencies
	 */
	import { __, _n, sprintf } from '@wordpress/i18n';
	import { createEventDispatcher } from 'svelte';

	/**
	 * Internal dependencies
	 */
	import {
		criticalCssStatus,
		failedProviderKeyCount,
		cssModuleName,
	} from '../../../stores/critical-css-status';
	import RefreshIcon from '../../../svg/refresh.svg';
	import TimeAgo from '../../../elements/TimeAgo.svelte';
	import InfoIcon from '../../../svg/info.svg';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import routerHistory from '../../../utils/router-history.ts';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';

	const dispatch = createEventDispatcher();
	const { navigate } = routerHistory;

	// Show an error if in error state, or if a success has 0 results.
	let showError = false;
	$: showError =
		$criticalCssStatus.status === 'error' ||
		( $criticalCssStatus.status === 'success' && $criticalCssStatus.success_count === 0 );
</script>

{#if $cssModuleName === 'critical-css' && $criticalCssStatus.status === 'requesting'}
	<slot name="progress" />
{:else if showError}
	<CriticalCssShowStopperError on:retry={() => dispatch( 'retryShowStopper' )} />
{:else}
	<div class="jb-critical-css__meta">
		<div class="summary">
			{#if $criticalCssStatus.success_count === 0}
				<div class="generating">
					<slot name="generating" />
				</div>
			{:else}
				<div class="successes">
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
						<slot name="generating-more" />
					{/if}
				</div>

				{#if $criticalCssStatus.progress === 100 && $failedProviderKeyCount > 0}
					<div class="failures">
						<InfoIcon />

						<TemplatedString
							template={sprintf(
								/* translators: %d is a number of CSS Files which failed to generate */
								_n(
									'%d file could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize this file.',
									'%d files could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize these files.',
									$failedProviderKeyCount,
									'jetpack-boost'
								),
								$failedProviderKeyCount
							)}
							vars={{
								...actionLinkTemplateVar( () => navigate( 'critical-css-advanced' ), 'advanced' ),
							}}
						/>
					</div>
				{/if}
			{/if}
		</div>
		<button type="button" class="components-button is-link" on:click={() => dispatch( 'retry' )}>
			<RefreshIcon />
			{__( 'Regenerate', 'jetpack-boost' )}
		</button>
	</div>
{/if}
