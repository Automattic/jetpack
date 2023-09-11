<script lang="ts">
	import { slide } from 'svelte/transition';
	import { __, _n, sprintf } from '@wordpress/i18n';
	import BackButton from '../../../elements/BackButton.svelte';
	import CloseButton from '../../../elements/CloseButton.svelte';
	import { replaceCssState, updateProvider } from '../../../stores/critical-css-state';
	import {
		criticalCssIssues,
		groupErrorsByFrequency,
	} from '../../../stores/critical-css-state-errors';
	import InfoIcon from '../../../svg/info.svg';
	import routerHistory from '../../../utils/router-history';
	import CriticalCssErrorDescription from '../elements/CriticalCssErrorDescription.svelte';

	const { navigate } = routerHistory;

	/**
	 * Figure out heading based on state.
	 */
	$: heading =
		activeIssues.length === 0
			? __( 'Congratulations, you have dealt with all the recommendations.', 'jetpack-boost' )
			: __(
					'While Jetpack Boost has been able to automatically generate optimized CSS for most of your important files & sections, we have identified a few more that require your attention.',
					'jetpack-boost'
			  );
	/**
	 * Automatically navigate back to main Settings page if generator isn't done.
	 */

	$: if ( $criticalCssIssues.length === 0 ) {
		navigate( -1 );
	}

	$: dismissedIssues = $criticalCssIssues.filter( issue => issue.error_status === 'dismissed' );
	$: activeIssues = $criticalCssIssues.filter( issue => issue.error_status !== 'dismissed' );

	function showDismissedIssues() {
		replaceCssState( {
			providers: $criticalCssIssues.map( issue => {
				issue.error_status = 'active';
				return issue;
			} ),
		} );
	}
</script>

<div class="jb-container--narrow jb-critical-css__advanced">
	<BackButton />

	<h3>
		{__( 'Critical CSS advanced recommendations', 'jetpack-boost' )}
	</h3>

	{#key heading}
		<section transition:slide|local>
			<p>{heading}</p>

			{#if dismissedIssues.length > 0}
				<p>
					<button class="components-button is-link" on:click={showDismissedIssues}>
						{sprintf(
							/* translators: %d is a number of recommendations which were previously hidden by the user */
							_n(
								'Show %d hidden recommendation.',
								'Show %d hidden recommendations.',
								dismissedIssues.length,
								'jetpack-boost'
							),
							dismissedIssues.length
						)}
					</button>
				</p>
			{/if}
		</section>
	{/key}

	{#each activeIssues as provider (provider.key)}
		<div class="panel" transition:slide|local>
			<CloseButton on:click={() => updateProvider( provider.key, { error_status: 'dismissed' } )} />

			<h4>
				<InfoIcon />
				{provider.label}
			</h4>

			<div class="problem">
				<CriticalCssErrorDescription errorSet={groupErrorsByFrequency( provider )[ 0 ]} />
			</div>
		</div>
	{/each}
</div>
