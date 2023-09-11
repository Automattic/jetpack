<script lang="ts">
	import {
		getScoreLetter,
		requestSpeedScores,
		didScoresChange,
	} from '@automattic/jetpack-boost-score-api';
	import { BoostScoreBar } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import { scoreChangeModal, ScoreChangeMessage } from '../../../api/speed-scores';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import ReactComponent from '../../../elements/ReactComponent.svelte';
	import { criticalCssState, isGenerating } from '../../../stores/critical-css-state';
	import { modulesState } from '../../../stores/modules';
	import RefreshIcon from '../../../svg/refresh.svg';
	import { recordBoostEvent } from '../../../utils/analytics';
	import { castToString } from '../../../utils/cast-to-string';
	import debounce from '../../../utils/debounce';
	import PopOut from '../elements/PopOut.svelte';
	import ScoreContext from '../elements/ScoreContext.svelte';
	import History from './History.svelte';

	const siteIsOnline = Jetpack_Boost.site.online;

	let loadError;
	let showPrevScores;
	let scoreLetter = '';

	let isLoading = false;

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

	// Flat list of which modules are active; useful for tracking changes in state.
	$: activeModules = Object.entries( $modulesState ).reduce( ( acc, [ key, value ] ) => {
		if ( key !== 'image_guide' && key !== 'image_size_analysis' ) {
			acc.push( value.active );
		}
		return acc;
	}, [] );

	// Keep a string describing the settings that may affect the score. We'll use it to
	// work out when we need a new speed score.
	$: currentScoreConfigString = JSON.stringify( [ activeModules, $criticalCssState.created ] );

	// State we had the last time we requested a speed score -- or when the page first loaded.
	$: lastSpeedScoreConfigString = lastSpeedScoreConfigString ?? currentScoreConfigString;

	// Any time the config changes, set a debounced refresh request (provided we're not already generating)
	$: if ( currentScoreConfigString !== lastSpeedScoreConfigString && ! $isGenerating ) {
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

	let modalData: ScoreChangeMessage | null = null;
	$: modalData = ! isLoading && ! scores.isStale && scoreChangeModal( scores );

	function dismissModal() {
		modalData = null;
	}
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
					<ScoreContext />
				{/if}
				<button
					type="button"
					class="components-button is-link"
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
		<History />
	{/if}
</div>

{#if modalData}
	<PopOut
		id={modalData.id}
		title={modalData.title}
		on:dismiss={() => dismissModal()}
		message={modalData.message}
		ctaLink={modalData.ctaLink}
		cta={modalData.cta}
	/>
{/if}
