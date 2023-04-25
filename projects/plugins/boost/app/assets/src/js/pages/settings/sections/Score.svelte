<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import {
		getScoreLetter,
		requestSpeedScores,
		didScoresChange,
		scoreChangeModal,
		ScoreChangeMessage,
	} from '../../../api/speed-scores';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import { criticalCssState, isGenerating } from '../../../stores/critical-css-state';
	import { modulesState } from '../../../stores/modules';
	import ComputerIcon from '../../../svg/computer.svg';
	import MobileIcon from '../../../svg/mobile.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import { recordBoostEvent } from '../../../utils/analytics';
	import { castToString } from '../../../utils/cast-to-string';
	import debounce from '../../../utils/debounce';
	import PopOut from '../elements/PopOut.svelte';
	import ScoreBar from '../elements/ScoreBar.svelte';
	import ScoreContext from '../elements/ScoreContext.svelte';

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

	refreshScore( false );

	/**
	 * The configuration that led to latest speed score.
	 */
	$: activeModules = Object.entries( $modulesState ).reduce( ( acc, [ key, value ] ) => {
		if ( key !== 'image_guide' && key !== 'image_size_analysis' ) {
			acc.push( value.active );
		}
		return acc;
	}, [] );
	$: lastCreatedState = $criticalCssState.created;
	$: currentScoreConfigString = JSON.stringify( {
		modules: activeModules,
		criticalCss: {
			created: lastCreatedState,
		},
	} );

	async function refreshScore( force = false ) {
		if ( ! siteIsOnline ) {
			return;
		}

		isLoading = true;
		loadError = undefined;

		try {
			scores = await requestSpeedScores( force );
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

	const debouncedRefreshScore = debounce( force => {
		refreshScore( force );
	}, 2000 );

	let modalData: ScoreChangeMessage | null = null;
	$: modalData = ! isLoading && ! scores.isStale && scoreChangeModal( scores );

	$: if ( currentScoreConfigString && $isGenerating === false ) {
		debouncedRefreshScore( true );
	}

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
				prevScore={scores.noBoost?.mobile}
				score={scores.current.mobile}
				active={siteIsOnline}
				{isLoading}
				{showPrevScores}
				noBoostScoreTooltip={__( 'Your mobile score without Boost', 'jetpack-boost' )}
			/>
		</div>

		<div class="jb-score-bar jb-score-bar--desktop">
			<div class="jb-score-bar__label">
				<ComputerIcon />
				<div>{__( 'Desktop score', 'jetpack-boost' )}</div>
			</div>
			<ScoreBar
				prevScore={scores.noBoost?.desktop}
				score={scores.current.desktop}
				active={siteIsOnline}
				{isLoading}
				{showPrevScores}
				noBoostScoreTooltip={__( 'Your desktop score without Boost', 'jetpack-boost' )}
			/>
		</div>
	</div>
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
