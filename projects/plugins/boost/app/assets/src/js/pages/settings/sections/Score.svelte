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
		debounce,
	} from '../../../api/speed-scores';
	import { __ } from '@wordpress/i18n';
	import { criticalCssStatus } from '../../../stores/critical-css-status';
	import { modules } from '../../../stores/modules';
	import { derived } from 'svelte/store';

	const siteIsOnline = Jetpack_Boost.site.online;

	let loadError;
	let isLoading = siteIsOnline;
	let showPrevScores;
	let scoreLetter = '';
	let scores = {
		mobile: 0,
		desktop: 0,
	};

	let previousScores = {
		mobile: 0,
		desktop: 0,
	};

	if ( siteIsOnline ) {
		refreshScore( false );
	}

	async function refreshScore( is_forced = false ) {
		isLoading = true;
		loadError = undefined;

		try {
			const scoresSet = await requestSpeedScores( is_forced );
			scores = scoresSet.current;
			previousScores = scoresSet.previous;
			scoreLetter = getScoreLetter( scores.mobile, scores.desktop );
			showPrevScores = didScoresImprove( scoresSet );
		} catch ( err ) {
			console.log( err );
			loadError = err;
		} finally {
			isLoading = false;
		}
	}

	const debouncedRefreshScore = debounce( is_forced => refreshScore( is_forced ), 3000 );

	// We do not want to force refresh the score if status and modules were the same on page load. So this initial assignment is necessary.
	let previousStatus = $criticalCssStatus.status;
	let previousModules = $modules;

	const dm = derived( modules, m => JSON.stringify( m ) );

	$: {
		// Force refresh if the lazy-images or render-blocking-js was changed
		if (
			$modules[ 'lazy-images' ].enabled !== previousModules[ 'lazy-images' ].enabled ||
			$modules[ 'render-blocking-js' ].enabled !== previousModules[ 'render-blocking-js' ].enabled
		) {
			debouncedRefreshScore( true );
		}

		// Force refresh if the critical-css was changed and we do not need to regenerate
		if (
			$modules[ 'critical-css' ].enabled !== previousModules[ 'critical-css' ].enabled &&
			( false === $modules[ 'critical-css' ].enabled || 'success' === $criticalCssStatus.status )
		) {
			debouncedRefreshScore( true );
		}

		// Force refresh the score if critical CSS finished generating.
		if ( 'success' === $criticalCssStatus.status && 'success' !== previousStatus ) {
			debouncedRefreshScore( true );
		}
		previousStatus = $criticalCssStatus.status;
		previousModules = $modules;
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
					on:click={() => debouncedRefreshScore( true )}
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
				bind:prevScore={previousScores.mobile}
				bind:score={scores.mobile}
				active={siteIsOnline}
				{isLoading}
				{showPrevScores}
			/>
		</div>

		<div class="jb-score-bar jb-score-bar--desktop">
			<div class="jb-score-bar__label">
				<ComputerIcon />
				<div>{__( 'Desktop score', 'jetpack-boost' )}</div>
			</div>
			<ScoreBar
				bind:prevScore={previousScores.desktop}
				bind:score={scores.desktop}
				active={siteIsOnline}
				{isLoading}
				{showPrevScores}
			/>
		</div>
	</div>
</div>
