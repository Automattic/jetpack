<script lang="ts">
	import { onMount } from 'svelte';
	import { __, sprintf } from '@wordpress/i18n';
	import Button from '../../elements/Button.svelte';
	import ErrorNotice from '../../elements/ErrorNotice.svelte';
	import RefreshIcon from '../../svg/refresh.svg';
	import MultiProgress from './MultiProgress.svelte';
	import { requestImageAnalysis, initializeISASummary, isaSummary } from './store/isa-summary';

	onMount( () => {
		initializeISASummary();
	} );

	let errorMessage: undefined | string;
	let busy = false;

	/**
	 * Calculate total number of issues.
	 */
	$: totalIssues = Object.values( $isaSummary?.groups || {} ).reduce(
		( total, group ) => total + group.issue_count,
		0
	);

	/**
	 * Start a new image analysis job.
	 */
	async function onStartAnalysis() {
		try {
			errorMessage = undefined;
			busy = true;
			await requestImageAnalysis();
		} catch ( err ) {
			errorMessage = err.message;
		} finally {
			busy = false;
		}
	}
</script>

{#if ! $isaSummary}
	<div class="summary">
		{__( 'Loading…', 'jetpack-boost' )}
	</div>
{:else if $isaSummary.status === 'not-found'}
	<div class="button-area">
		<Button disabled={busy} on:click={onStartAnalysis}>Start image analysis</Button>
	</div>
{:else if $isaSummary.status === 'new'}
	<!-- Boost fetches a list of the site's content between creating the report and enqueuing the job. Status = new. -->
	<div class="wait-notice">
		{__( 'Give us a few minutes while we go through your content…', 'jetpack-boost' )}
	</div>
{:else if $isaSummary.status === 'error'}
	<!-- @TODO -->
	<pre>
		{JSON.stringify( $isaSummary )}
	</pre>
{:else}
	<!-- Boost is either generating a report, or has finished one. -->
	{@const  inProgress = $isaSummary.status === 'queued' }

	{#if inProgress}
		<div class="summary-line wait-notice">
			{__( 'Give us a few minutes while we go through your images…', 'jetpack-boost' )}
		</div>
	{:else}
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

			<button type="button" class="components-button is-link" on:click={onStartAnalysis}>
				<RefreshIcon />
				{__( 'Analyze again', 'jetpack-boost' )}
			</button>
		</div>
	{/if}

	<MultiProgress />

	<div class="button-area">
		<Button href="#image-size-analysis/all/1">
			{inProgress
				? __( 'See report in progress', 'jetpack-boost' )
				: __( 'See full report', 'jetpack-boost' )}
		</Button>
	</div>
{/if}

{#if errorMessage}
	<div class="error-area">
		<ErrorNotice title={__( 'Failed to request an Image Analysis job', 'jetpack-boost' )}>
			{errorMessage}
		</ErrorNotice>
	</div>
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
