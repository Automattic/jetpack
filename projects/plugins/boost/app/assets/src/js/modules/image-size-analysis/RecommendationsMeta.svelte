<script lang="ts">
	import { onMount } from 'svelte';
	import { __, sprintf } from '@wordpress/i18n';
	import Button from '../../elements/Button.svelte';
	import ErrorNotice from '../../elements/ErrorNotice.svelte';
	import NoticeIcon from '../../svg/notice-outline.svg';
	import RefreshIcon from '../../svg/refresh.svg';
	import { recordBoostEvent, recordBoostEventAndRedirect } from '../../utils/analytics';
	import MultiProgress from './MultiProgress.svelte';
	import { resetIsaQuery } from './store/isa-data';
	import {
		requestImageAnalysis,
		initializeIsaSummary,
		isaSummary,
		ISAStatus,
	} from './store/isa-summary';

	onMount( () => {
		initializeIsaSummary();
	} );

	let submitError: undefined | string;
	let requestingReport = false;

	/**
	 * Calculate total number of issues.
	 */
	$: totalIssues = Object.values( $isaSummary?.groups || {} ).reduce(
		( total, group ) => total + group.issue_count,
		0
	);

	/**
	 * Work out if there is an error to show in the UI.
	 */
	$: errorMessage =
		submitError ||
		( $isaSummary?.status === ISAStatus.Stuck &&
			__(
				'Your Image Size Analysis task seems to have gotten stuck, or our system is under unusual load. Please try again. If the issue persists, please contact support.',
				'jetpack-boost'
			) );

	/**
	 * Work out whether we have a 'give us a minute' notice to show.
	 */
	$: waitNotice =
		( requestingReport && __( 'Getting ready…', 'jetpack-boost' ) ) ||
		( $isaSummary?.status === ISAStatus.New && __( 'Warming up the engine…', 'jetpack-boost' ) ) ||
		( $isaSummary?.status === ISAStatus.Queued &&
			__( 'Give us a few minutes while we go through your images…', 'jetpack-boost' ) );

	/**
	 * Start a new image analysis job.
	 */
	async function onStartAnalysis() {
		const $event_name =
			$isaSummary.status === ISAStatus.Completed ? 'clicked_restart_isa' : 'clicked_start_isa';
		recordBoostEvent( $event_name, {} );

		try {
			errorMessage = undefined;
			requestingReport = true;
			await requestImageAnalysis();
			resetIsaQuery();
		} catch ( err ) {
			errorMessage = err.message;
		} finally {
			requestingReport = false;
		}
	}
</script>

{#if ! $isaSummary}
	<div class="summary">
		{__( 'Loading…', 'jetpack-boost' )}
	</div>
{:else}
	<!-- Show error messages or "please wait" messages. -->
	{#if errorMessage}
		<div class="error-area">
			<ErrorNotice title={__( 'Something has gone wrong.', 'jetpack-boost' )}>
				{errorMessage}
			</ErrorNotice>
		</div>
	{:else if waitNotice}
		<div class="summary-line wait-notice">
			{waitNotice}
		</div>
	{/if}

	<!-- Show a summary line if the report is completed. -->
	{#if ! requestingReport && $isaSummary.status === ISAStatus.Completed}
		<div class="summary-line">
			{#if totalIssues > 0}
				<div class="has-issues summary">
					<NoticeIcon class="icon" />
					{sprintf(
						/* translators: %d is the number of issues that were found */
						__( 'Found a total of %d issues', 'jetpack-boost' ),
						totalIssues
					)}
				</div>
			{:else}
				<div class="summary">
					{__( 'Congratulations; no issues found.', 'jetpack-boost' )}
				</div>
			{/if}

			<button
				type="button"
				class="components-button is-link"
				on:click={onStartAnalysis}
				disabled={requestingReport}
			>
				<RefreshIcon />
				{__( 'Analyze again', 'jetpack-boost' )}
			</button>
		</div>
	{/if}

	<!-- Show progress if a job is rolling. -->
	{#if ! requestingReport && [ ISAStatus.Completed, ISAStatus.Queued ].includes( $isaSummary.status )}
		<MultiProgress />
	{/if}

	<!-- Show a button to view the report if it's in progress or completed. -->
	{#if [ ISAStatus.Queued, ISAStatus.Completed ].includes( $isaSummary.status ) && ! requestingReport}
		<div class="button-area">
			<Button
				disabled={requestingReport}
				on:click={() =>
					recordBoostEventAndRedirect(
						'#image-size-analysis/all/1',
						'clicked_view_isa_report',
						{}
					)}
			>
				{$isaSummary.status === ISAStatus.Completed
					? __( 'See full report', 'jetpack-boost' )
					: __( 'View report in progress', 'jetpack-boost' )}
			</Button>
		</div>
	{/if}

	<!-- Show a button to kick off a report -->
	{#if ! [ ISAStatus.New, ISAStatus.Queued, ISAStatus.Completed ].includes( $isaSummary.status )}
		<div class="button-area">
			<Button disabled={requestingReport} on:click={onStartAnalysis}>
				{$isaSummary.status === ISAStatus.Completed
					? __( 'Analyze again', 'jetpack-boost' )
					: __( 'Start image analysis', 'jetpack-boost' )}
			</Button>
		</div>
	{/if}
{/if}

<style lang="scss">
	@use '../../../css/main/variables.scss' as *;

	.summary-line {
		font-size: 14px;
		line-height: 22px;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 17px;

		@media ( max-width: 600px ) {
			flex-direction: column;
		}
	}

	.summary-line button {
		:global( svg ) {
			margin: 4px 4px 2px 0;
			fill: $jetpack-green;
		}

		@media ( max-width: 600px ) {
			margin-top: 15px;
		}
	}

	.summary {
		margin-right: 5px;
		flex-grow: 1;
		position: relative;
		color: $jetpack-green;
	}

	.has-issues {
		color: $red_50;
	}

	.has-issues :global( svg ) {
		width: 22px;
		height: 22px;
		top: 4px;
		position: relative;
	}

	.wait-notice {
		color: var( --wp-admin-theme-color );
	}

	.error-area {
		margin-top: 16px;
	}

	.button-area {
		margin-top: 32px;
	}
</style>
