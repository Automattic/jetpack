<script lang="ts">
	import { __, _n, sprintf } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import {
		criticalCssStatus,
		showError,
		failedProviderKeyCount,
	} from '../../../stores/critical-css-status';
	import InfoIcon from '../../../svg/info.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import { getTimeAgoStore } from '../../../utils/describe-time-ago';
	import generateCriticalCss from '../../../utils/generate-critical-css';
	import routerHistory from '../../../utils/router-history';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';

	$: timeAgoText = getTimeAgoStore( new Date( $criticalCssStatus.updated * 1000 ) );

	const { navigate } = routerHistory;
</script>

{#if $criticalCssStatus.status === 'requesting'}
	<div class="jb-critical-css-progress">
		<span class="jb-critical-css-progress__label">
			{__(
				'Generating Critical CSS. Please don’t leave this page until completed.',
				'jetpack-boost'
			)}
		</span>
		<div
			role="progressbar"
			aria-valuemax={100}
			aria-valuemin={0}
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
{:else if $showError}
	<CriticalCssShowStopperError on:retry={() => generateCriticalCss( true, true )} />
{:else}
	<div class="jb-critical-css__meta">
		<div class="summary">
			{#if $criticalCssStatus.success_count > 0}
				{#if $criticalCssStatus.updated}
					<div class="successes">
						<TemplatedString
							template={__(
								"Critical CSS was generated <timeago></timeago>. Don't forget to regenerate it often to optimize your site's performance.",
								'jetpack-boost'
							)}
							vars={{
								timeago: [ 'span', {}, $timeAgoText ],
							}}
						/>
					</div>
				{/if}

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
								...actionLinkTemplateVar( () => navigate( 'critical-css-advanced' ), 'advanced' ),
							}}
						/>
					</div>
				{/if}
			{/if}
		</div>

		<button type="button" class="components-button is-link" on:click={() => generateCriticalCss()}>
			<RefreshIcon />
			{__( 'Regenerate Critical CSS', 'jetpack-boost' )}
		</button>
	</div>
{/if}
