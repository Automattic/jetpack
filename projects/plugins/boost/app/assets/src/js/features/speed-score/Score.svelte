<script lang="ts">
	import {
		getScoreLetter,
		requestSpeedScores,
		didScoresChange,
		getScoreMovementPercentage,
	} from '@automattic/jetpack-boost-score-api';
	import { BoostScoreBar } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import ContextTooltip from './context-tooltip/context-tooltip';
	import History from '../performance-history/History.svelte';
	import ErrorNotice from '$features/ErrorNotice.svelte';
	import ReactComponent from '$features/ReactComponent.svelte';
	import { dismissedAlerts } from '$lib/stores/dismissed-alerts';
	import { modulesState } from '$lib/stores/modules';
	import { recordBoostEvent } from '$lib/utils/analytics';
	import { castToString } from '$lib/utils/cast-to-string';
	import debounce from '$lib/utils/debounce';
	import RefreshIcon from '$svg/refresh.svg';
	import PopOut from './pop-out/pop-out';

	// @todo - move score-context markup/styles here, as it's not used anywhere else.

	// Flat list of which modules are active; useful for tracking changes in state.
	export let activeModules: boolean[];
	export let criticalCssCreated: number;
	export let criticalCssIsGenerating: boolean;

	const siteIsOnline = Jetpack_Boost.site.online;

	let loadError;
	let showPrevScores;
	let scoreLetter = '';

	let isLoading = false;
	let closedScorePopOut = false;

	let scores = {
		current: {
			mobile: 0,
			desktop: 0,
		},
		noBoost: null,
		isStale: false,
	};

	// Load the speed score. Will be cached in the plugin.
	loadScore();

	// Keep a string describing the settings that may affect the score. We'll use it to
	// work out when we need a new speed score.
	$: currentScoreConfigString = JSON.stringify( [ activeModules, criticalCssCreated ] );

	// State we had the last time we requested a speed score -- or when the page first loaded.
	$: lastSpeedScoreConfigString = lastSpeedScoreConfigString ?? currentScoreConfigString;

	// Any time the config changes, set a debounced refresh request (provided we're not already generating)
	$: if ( currentScoreConfigString !== lastSpeedScoreConfigString && ! criticalCssIsGenerating ) {
		debouncedRefreshScore();
	}

	// Debounced function: Refresh the speed score if the config has changed.
	const debouncedRefreshScore = debounce( async () => {
		if ( currentScoreConfigString !== lastSpeedScoreConfigString ) {
			await loadScore( true );
		}
	}, 2000 );

	/**
	 * Load the speed score from the plugin
	 *
	 * @param {boolean} regenerate - If true, ask for a new speed score; discarding cached values.
	 */
	async function loadScore( regenerate = false ) {
		// Don't run in offline mode.
		if ( ! siteIsOnline ) {
			return;
		}

		isLoading = true;
		loadError = undefined;
		closedScorePopOut = false;

		try {
			lastSpeedScoreConfigString = currentScoreConfigString;
			scores = await requestSpeedScores(
				regenerate,
				wpApiSettings.root,
				Jetpack_Boost.site.url,
				wpApiSettings.nonce
			);
			scoreLetter = getScoreLetter( scores.current.mobile, scores.current.desktop );
			showPrevScores = didScoresChange( scores ) && ! scores.isStale;
		} catch ( err ) {
			recordBoostEvent( 'speed_score_request_error', {
				error_message: castToString( err.message ),
			} );
			// eslint-disable-next-line no-console
			loadError = err;
		} finally {
			isLoading = false;
		}
	}

	// Work out if there is a score change to show in the score popout dialog.
	let showScoreChange: number | false = false;
	$: showScoreChange =
		! isLoading && ! scores.isStale && ! closedScorePopOut && getScoreMovementPercentage( scores );

	const onPerformanceHistoryDismissFreshStart = () => {
		$dismissedAlerts.performance_history_fresh_start = true;
	};

	$: performanceHistoryNeedsUpgrade = $modulesState.performance_history.available === false;
	$: performanceHistoryIsFreshStart = $dismissedAlerts.performance_history_fresh_start !== true;
</script>

<div class="jb-container">
	<div id="jp-admin-notices" class="jetpack-boost-jitm-card" />
	<div class="jb-site-score" class:loading={isLoading}>
		{#if siteIsOnline}
			<div class="jb-site-score__top">
				<h2>
					{#if isLoading}
						{__( 'Loading…', 'jetpack-boost' )}
					{:else if loadError}
						{__( 'Whoops, something went wrong', 'jetpack-boost' )}
					{:else}
						{__( 'Overall Score', 'jetpack-boost' )}: {scoreLetter}
					{/if}
				</h2>
				{#if ! isLoading && ! loadError}
					<ReactComponent this={ContextTooltip} />
				{/if}
				<button
					type="button"
					class="action-button components-button is-link"
					disabled={isLoading}
					on:click={() => loadScore( true )}
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
				on:retry={() => loadScore( true )}
			/>
		{/if}

		<ReactComponent
			this={BoostScoreBar}
			prevScore={scores.noBoost?.mobile}
			score={scores.current.mobile}
			active={siteIsOnline}
			{isLoading}
			{showPrevScores}
			scoreBarType="mobile"
			noBoostScoreTooltip={__( 'Your mobile score without Boost', 'jetpack-boost' )}
		/>

		<ReactComponent
			this={BoostScoreBar}
			prevScore={scores.noBoost?.desktop}
			score={scores.current.desktop}
			active={siteIsOnline}
			{isLoading}
			{showPrevScores}
			scoreBarType="desktop"
			noBoostScoreTooltip={__( 'Your desktop score without Boost', 'jetpack-boost' )}
		/>
	</div>
	{#if siteIsOnline}
		<History
			needsUpgrade={performanceHistoryNeedsUpgrade}
			onDismissFreshStart={onPerformanceHistoryDismissFreshStart}
			isFreshStart={performanceHistoryIsFreshStart}
		/>
	{/if}
</div>

<ReactComponent
	this={PopOut}
	scoreChange={showScoreChange}
	onClose={() => ( closedScorePopOut = true )}
/>
