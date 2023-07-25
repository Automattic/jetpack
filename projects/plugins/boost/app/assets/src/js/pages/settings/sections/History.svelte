<script lang="ts">
	import { requestSpeedScoresHistory } from '@automattic/jetpack-boost-score-api';
	import { BoostScoreGraph } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import ReactComponent from '../../../elements/ReactComponent.svelte';
	import RefreshIcon from '../../../svg/refresh.svg';
	import { recordBoostEvent } from '../../../utils/analytics';
	import { castToString } from '../../../utils/cast-to-string';
	import ScoreContext from '../elements/ScoreContext.svelte';

	const siteIsOnline = Jetpack_Boost.site.online;

	let loadError;
	const scoreLetter = '';

	let isLoading = false;

	let scores = {};

	const exampleData = [
		[ 1689379200, 1689465600, 1689552000, 1689638400, 1689724800, 1689811200, 1689897600 ],
		[ 76, 81, 87, 89, 91, 94, 99 ],
		[ 72, 78, 80, 81, 5, 74, 84, 89 ],
	];

	// Load the speed score. Will be cached in the plugin.
	loadScore();

	/**
	 * Load the speed history from the API
	 *
	 */
	async function loadScore() {
		// Don't run in offline mode.
		if ( ! siteIsOnline ) {
			return;
		}

		isLoading = true;
		loadError = undefined;

		try {
			scores = await requestSpeedScoresHistory(
				wpApiSettings.root,
				Jetpack_Boost.site.url,
				wpApiSettings.nonce
			);
		} catch ( err ) {
			recordBoostEvent( 'speed_history_request_error', {
				error_message: castToString( err.message ),
			} );
			// eslint-disable-next-line no-console
			loadError = err;
		} finally {
			isLoading = false;
		}
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
					on:click={() => loadScore()}
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
				on:retry={() => loadScore()}
			/>
		{/if}
		<ReactComponent
			this={BoostScoreGraph}
			data={exampleData}
			title={__( 'Performance history', 'jetpack-boost' )}
		/>
	</div>
</div>
