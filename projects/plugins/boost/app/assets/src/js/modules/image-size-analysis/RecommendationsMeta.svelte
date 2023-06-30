<script lang="ts">
	import { onMount } from 'svelte';
	import { __, sprintf } from '@wordpress/i18n';
	import Button from '../../elements/Button.svelte';
	import ErrorNotice from '../../elements/ErrorNotice.svelte';
	import RefreshIcon from '../../svg/refresh.svg';
	import MultiProgress from './MultiProgress.svelte';
	import { requestImageAnalysis, initializeIsaSummary, isaSummary } from './store/isa-summary';

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
		( $isaSummary?.status === 'stuck' &&
			__(
				'Oops. We seem to have run into an internal error. Please try again.',
				'jetpack-boost'
			) );

	/**
	 * Work out whether we have a 'give us a minute' notice to show.
	 */
	$: waitNotice =
		( $isaSummary?.status === 'new' &&
			__( 'Give us a few minutes while we go through your content…', 'jetpack-boost' ) ) ||
		( $isaSummary?.status === 'queued' &&
			__( 'Give us a few minutes while we go through your images…', 'jetpack-boost' ) );

	/**
	 * Start a new image analysis job.
	 */
	async function onStartAnalysis() {
		try {
			errorMessage = undefined;
			requestingReport = true;
			await requestImageAnalysis();
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
	{#if ! requestingReport && $isaSummary.status === 'complete'}
		<div class="summary-line">
			{#if totalIssues > 0}
				<div class="has-issues summary">
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
	{#if $isaSummary.status === 'queued'}
		<MultiProgress />
	{/if}

	<!-- Show a button to view the report if it's in progress or completed. -->
	{#if [ 'queued', 'complete' ].includes( $isaSummary.status ) && ! requestingReport}
		<div class="button-area">
			<Button href="#image-size-analysis/all/1" disabled={requestingReport}>
				{__( 'See report in progress', 'jetpack-boost' )}
			</Button>
		</div>
	{/if}

	<!-- Show a button to kick off a report -->
	{#if ! [ 'new', 'queued' ].includes( $isaSummary )}
		<div class="button-area">
			<Button disabled={requestingReport} on:click={onStartAnalysis}>
				{$isaSummary.status === 'complete'
					? __( 'Analyze again', 'jetpack-boost' )
					: __( 'Start image analysis', 'jetpack-boost' )}
			</Button>
		</div>
	{/if}
{/if}

<style>
	.summary-line {
		font-size: 14px;
		line-height: 22px;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 17px;
	}

	.summary {
		margin-right: 5px;
		flex-grow: 1;
		position: relative;
	}

	.has-issues {
		color: var( --red_50 );
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
