<script>
	import ComputerIcon from '../../../svg/computer.svg';
	import MobileIcon from '../../../svg/mobile.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import ScoreBar from '../elements/ScoreBar.svelte';
	import ScoreContext from '../elements/ScoreContext.svelte';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import {
		getScoreLetter,
		requestSpeedScores,
		didScoresImprove,
		getScoreImprovementPercentage,
	} from '../../../api/speed-scores';
	import debounce from '../../../utils/debounce';
	import { __ } from '@wordpress/i18n';
	import { criticalCssStatus } from '../../../stores/critical-css-status';
	import { modules } from '../../../stores/modules';
	import { derived } from 'svelte/store';
	import RatingCard from '../elements/RatingCard.svelte';

	const siteIsOnline = Jetpack_Boost.site.online;

	let loadError;
	let isLoading = siteIsOnline;
	let showPrevScores;
	let scoreLetter = '';
	let scores = {
		current: {
			mobile: 0,
			desktop: 0,
		},
		previous: null,
	};
	let showRatingCard = false;
	let improvementPercentage = 0;

	if ( siteIsOnline ) {
		refreshScore( false );
	}

	/**
	 * Derived datastore which makes it easy to check if module states are currently in sync with server.
	 */
	const modulesInSync = derived( modules, $modules => {
		return ! Object.values( $modules ).some( m => m.synced === false );
	} );

	/**
	 * String representation of the current state that may impact the score.
	 *
	 * @type {Readable<string>}
	 */
	const scoreConfigString = derived(
		[ modules, criticalCssStatus ],
		( [ $modules, $criticalCssStatus ] ) =>
			JSON.stringify( {
				modules: $modules,
				criticalCss: {
					created: $criticalCssStatus.created,
				},
			} )
	);

	/**
	 * The configuration that led to latest speed score.
	 *
	 * @type {Readable<string>}
	 */
	let currentScoreConfigString = $scoreConfigString;

	async function refreshScore( force = false ) {
		isLoading = true;
		loadError = undefined;

		try {
			scores = await requestSpeedScores( force );
			scoreLetter = getScoreLetter( scores.current.mobile, scores.current.desktop );
			showPrevScores = didScoresImprove( scores );
			currentScoreConfigString = $scoreConfigString;
		} catch ( err ) {
			console.log( err );
			loadError = err;
		} finally {
			isLoading = false;
		}
	}

	const debouncedRefreshScore = debounce( force => {
		// If the configuration has changed, the previous speed score is no longer relevant. But we don't want to
		// trigger a refresh while critical css is still generating.
		if (
			! $criticalCssStatus.generating &&
			$modulesInSync &&
			$scoreConfigString !== currentScoreConfigString
		) {
			refreshScore( force );
		}
	}, 2000 );

	$: {
		// Mentioning the stores here for change detection.
		$scoreConfigString;
		$criticalCssStatus.generating;
		$modulesInSync;

		debouncedRefreshScore( true );
	}

	$: {
		if ( didScoresImprove( scores ) && Jetpack_Boost.preferences.showRatingPrompt ) {
			showRatingCard = true;
			Jetpack_Boost.preferences.showRatingPrompt = false;
			improvementPercentage = getScoreImprovementPercentage( scores );
		}
	}
</script>

<div class="jb-container">
	<div class="jb-site-score" class:loading={isLoading}>
		{#if siteIsOnline}
			<div class="jb-site-score__top">
				<h2>
					{#if isLoading}
						{__( 'Loading…', 'jetpack-boost' )}
					{:else if loadError}
						{__( 'Whoops, something went wrong', 'jetpack-boost' )}
					{:else}
						{__( 'Overall score', 'jetpack-boost' )}: {scoreLetter}
					{/if}
				</h2>
				{#if ! isLoading && ! loadError}
					<ScoreContext />
				{/if}
				<button
					type="button"
					class="components-button is-link"
					disabled={isLoading}
					on:click={() => refreshScore( true )}
				>
					<RefreshIcon />
					{__( 'Refresh', 'jetpack-boost' )}
				</button>
			</div>
		{:else}
			<div class="jb-site-score__offline">
				<h2>
					{__( 'Website Offline', 'jetpack-boost' )}
				</h2>
				<p>
					{__(
						'All Jetpack Boost features are still available, but to get a performance score you would first have to make your website available online.',
						'jetpack-boost'
					)}
				</p>
			</div>
		{/if}

		{#if loadError}
			<ErrorNotice
				title={__( 'Failed to load Speed Scores', 'jetpack-boost' )}
				error={loadError}
				suggestion={__( '<action name="retry">Try again</action>', 'jetpack-boost' )}
				on:retry={() => refreshScore( true )}
			/>
		{/if}

		<div class="jb-score-bar jb-score-bar--mobile">
			<div class="jb-score-bar__label">
				<MobileIcon />
				<div>{__( 'Mobile score', 'jetpack-boost' )}</div>
			</div>
			<ScoreBar
				prevScore={scores.previous?.mobile}
				score={scores.current.mobile}
				active={siteIsOnline}
				{isLoading}
				{showPrevScores}
				previousScoreTooltip={__( 'Your previous mobile score', 'jetpack-boost' )}
			/>
		</div>

		<div class="jb-score-bar jb-score-bar--desktop">
			<div class="jb-score-bar__label">
				<ComputerIcon />
				<div>{__( 'Desktop score', 'jetpack-boost' )}</div>
			</div>
			<ScoreBar
				prevScore={scores.previous?.desktop}
				score={scores.current.desktop}
				active={siteIsOnline}
				{isLoading}
				{showPrevScores}
				previousScoreTooltip={__( 'Your previous desktop score', 'jetpack-boost' )}
			/>
		</div>
	</div>
</div>
{#if showRatingCard}
	<RatingCard on:dismiss={() => ( showRatingCard = false )} improvement={improvementPercentage} />
{/if}
