<script lang="ts">
	import { __, _n, sprintf } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import TimeAgo from '../../../elements/TimeAgo.svelte';
	import { showError } from '../../../stores/critical-css-status';
	import { criticalCssStatus, failedProviderKeyCount } from '../../../stores/critical-css-status';
	import InfoIcon from '../../../svg/info.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import { requestCloudCss, retryCloudCss } from '../../../utils/cloud-css';
	import routerHistory from '../../../utils/router-history';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';

	const { navigate } = routerHistory;
</script>

{#if $showError}
	<CriticalCssShowStopperError
		supportLink="https://jetpackme.wordpress.com/contact-support/"
		on:retry={retryCloudCss}
	/>
{:else}
	<div class="jb-critical-css__meta">
		<div class="summary">
			{#if $criticalCssStatus.success_count === 0}
				<div class="generating">
					{__( 'Jetpack Boost will generate Critical CSS for you automatically.', 'jetpack-boost' )}
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
					{#if $criticalCssStatus.updated}
						<TimeAgo time={new Date( $criticalCssStatus.updated * 1000 )} />.
					{/if}
					{#if $criticalCssStatus.progress < 100}
						<span>{__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}</span>
					{/if}
				</div>

				{#if $criticalCssStatus.status !== 'requesting' && $failedProviderKeyCount > 0}
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
		{#if $criticalCssStatus.status !== 'requesting'}
			<button type="button" class="components-button is-link" on:click={() => requestCloudCss()}>
				<RefreshIcon />
				{__( 'Regenerate Critical CSS', 'jetpack-boost' )}
			</button>
		{/if}
	</div>
{/if}
