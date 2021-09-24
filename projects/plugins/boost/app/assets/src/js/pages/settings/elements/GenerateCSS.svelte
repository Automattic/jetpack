<script>
	import InfoIcon from '../../../svg/info.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import generateCriticalCss from '../../../utils/generate-critical-css';
	import { criticalCssStatus, failedProviderKeyCount } from '../../../stores/critical-css-status';
	import { __, _n, sprintf } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import { navigateTo } from '../../../stores/url-fragment';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import TimeAgo from '../../../elements/TimeAgo.svelte';

	// Show an error if in error state, or if a success has 0 results.
	let showError = false;
	$: showError =
		$criticalCssStatus.status === 'error' ||
		( $criticalCssStatus.status === 'success' && $criticalCssStatus.success_count === 0 );
</script>

{#if $criticalCssStatus.generating}
	<div class="jb-critical-css-progress">
		<span class="jb-critical-css-progress__label">
			{__( 'Generating Critical CSS…', 'jetpack-boost' )}
		</span>
		<div
			role="progressbar"
			aria-valuemax="100"
			aria-valuemin="0"
			aria-valuenow={$criticalCssStatus.progress}
			class="jb-progress-bar"
		>
			<div
				class="jb-progress-bar__filler"
				aria-hidden="true"
				style={`width: ${ $criticalCssStatus.progress }%;`}
			/>
		</div>
	</div>
{:else if showError}
	<CriticalCssShowStopperError />
{:else if $criticalCssStatus.status === 'success'}
	<div class="jb-critical-css__meta">
		<div class="summary">
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
				<TimeAgo time={new Date( $criticalCssStatus.created * 1000 )} />.
			</div>
			{#if $failedProviderKeyCount > 0}
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
							...actionLinkTemplateVar( () => navigateTo( 'critical-css-advanced' ), 'advanced' ),
						}}
					/>
				</div>
			{/if}
		</div>

		<button type="button" class="components-button is-link" on:click={generateCriticalCss}>
			<RefreshIcon />
			{__( 'Regenerate', 'jetpack-boost' )}
		</button>
	</div>
{/if}
