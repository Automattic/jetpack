<script>
	import ComputerIcon from '../../../svg/computer.svg';
	import MobileIcon from '../../../svg/mobile.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import ScoreBar from '../elements/ScoreBar.svelte';
	import ScoreContext from '../elements/ScoreContext.svelte';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import { getScoreLetter, clearCache, requestSpeedScores } from '../../../api/speed-scores';
	import { __ } from '@wordpress/i18n';

	const siteIsOnline = Jetpack_Boost.site.online;

	let loadError;
	let isLoading = siteIsOnline;
	let scoreLetter = '';
	let scores = {
		mobile: 0,
		desktop: 0,
	};

	if ( siteIsOnline ) {
		refreshScore( false );
	}

	async function refreshScore( force = false ) {
		isLoading = true;
		loadError = undefined;

		try {
			if ( force ) {
				await clearCache();
			}

			scores = await requestSpeedScores();
			scoreLetter = getScoreLetter( scores.mobile, scores.desktop );
		} catch ( err ) {
			loadError = err;
		} finally {
			isLoading = false;
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
			<ScoreBar bind:score={scores.mobile} active={siteIsOnline} {isLoading} />
		</div>

		<div class="jb-score-bar jb-score-bar--desktop">
			<div class="jb-score-bar__label">
				<ComputerIcon />
				<div>{__( 'Desktop score', 'jetpack-boost' )}</div>
			</div>
			<ScoreBar bind:score={scores.desktop} active={siteIsOnline} {isLoading} />
		</div>
	</div>
</div>
