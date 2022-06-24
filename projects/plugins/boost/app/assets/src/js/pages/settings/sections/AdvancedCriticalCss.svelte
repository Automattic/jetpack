<script>
	import { slide } from 'svelte/transition';
	import { __, _n, sprintf } from '@wordpress/i18n';
	import BackButton from '../../../elements/BackButton.svelte';
	import CloseButton from '../../../elements/CloseButton.svelte';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import {
		dismissRecommendation,
		activeRecommendations,
		dismissedRecommendations,
		clearDismissedRecommendations,
		dismissalError,
		setDismissalError,
	} from '../../../stores/critical-css-recommendations.ts';
	import { isFinished } from '../../../stores/critical-css-status';
	import InfoIcon from '../../../svg/info.svg';
	import generateCriticalCss from '../../../utils/generate-critical-css';
	import routerHistory from '../../../utils/router-history';
	import CriticalCssErrorDescription from '../elements/CriticalCssErrorDescription.svelte';

	const { navigate } = routerHistory;

	function onRetry() {
		generateCriticalCss();
		navigate( -1 );
	}

	/**
	 * Dismisses a recommendation by key.
	 *
	 * @param {string} key Recommendation key to dismiss.
	 */
	async function dismiss( key ) {
		try {
			await dismissRecommendation( key );
		} catch ( error ) {
			setDismissalError( __( 'Failed to dismiss recommendation', 'jetpack-boost' ), error );
		}
	}
	/**
	 * Show the previously dismissed recommendations.
	 */
	async function showDismissedRecommendations() {
		try {
			await clearDismissedRecommendations();
		} catch ( error ) {
			setDismissalError(
				__( 'Failed to show the dismissed recommendations', 'jetpack-boost' ),
				error
			);
		}
	}

	/**
	 * Figure out heading based on state.
	 */
	let heading;
	$: heading =
		$activeRecommendations.length === 0
			? __( 'Congratulations, you have dealt with all the recommendations.', 'jetpack-boost' )
			: __(
					'While Jetpack Boost has been able to automatically generate optimized CSS for most of your important files & sections, we have identified a few more that require your attention.',
					'jetpack-boost'
			  );
	/**
	 * Automatically navigate back to main Settings page if generator isn't done.
	 */
	$: if ( ! $isFinished ) {
		navigate( -1 );
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

			{#if $dismissedRecommendations.length > 0}
				<p>
					<button class="components-button is-link" on:click={showDismissedRecommendations}>
						{sprintf(
							/* translators: %d is a number of recommendations which were previously hidden by the user */
							_n(
								'Show %d hidden recommendation.',
								'Show %d hidden recommendations.',
								$dismissedRecommendations.length,
								'jetpack-boost'
							),
							$dismissedRecommendations.length
						)}
					</button>
				</p>
			{/if}
		</section>
	{/key}

	{#if $dismissalError}
		<ErrorNotice title={$dismissalError.title} error={$dismissalError.error} />
	{/if}

	{#each $activeRecommendations as recommendation (recommendation.key)}
		<div class="panel" transition:slide|local>
			<CloseButton on:click={() => dismiss( recommendation.key )} />

			<h4>
				<InfoIcon />
				{recommendation.label}
			</h4>

			{#each [ recommendation.errors[ 0 ] ] as errorSet}
				<div class="problem">
					<CriticalCssErrorDescription {errorSet} on:retry={onRetry} />
				</div>
			{/each}
		</div>
	{/each}
</div>
