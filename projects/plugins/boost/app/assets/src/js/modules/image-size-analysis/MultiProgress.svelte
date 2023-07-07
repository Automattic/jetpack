<script lang="ts">
	import { sprintf, __ } from '@wordpress/i18n';
	import ProgressBar from '../../elements/ProgressBar.svelte';
	import Spinner from '../../elements/Spinner.svelte';
	import { Link } from '../../utils/router';
	import { isaGroupLabels, isaSummary } from './store/isa-summary';

	function safePercent( value: number, outOf: number ): number {
		if ( ! outOf ) {
			return 100;
		}

		return Math.min( 100, Math.max( 0, ( value * 100 ) / outOf ) );
	}
</script>

<div class="jb-multi-progress">
	{#each Object.entries( $isaSummary.groups ) as [group, summary], index}
		{@const  progress = safePercent( summary.scanned_pages, summary.total_pages ) }
		{@const  isDone = progress === 100 }
		{@const  hasIssues = summary.issue_count > 0 }

		<div class="jb-entry">
			<div class="jb-progress">
				<ProgressBar progress={safePercent( summary.scanned_pages, summary.total_pages )} />
			</div>

			{#if progress > 0 && progress < 100}
				<Spinner />
			{:else}
				<Link class="jb-navigator-link" to="/image-size-analysis/{group}/1">
					<span class="jb-bubble" class:done={isDone}>
						{isDone ? '✓' : index + 1}
					</span>
				</Link>
			{/if}

			<div class="jb-category-name">
				<Link class="jb-navigator-link" to="/image-size-analysis/{group}/1">
					{isaGroupLabels[ group ] || group}
				</Link>
			</div>

			{#if isDone || hasIssues}
				<div class="jb-status" class:has-issues={hasIssues}>
					<Link class="jb-navigator-link" to="/image-size-analysis/{group}/1">
						{#if hasIssues}
							{sprintf(
								/* translators: %d is the number of items in this list hidden behind this link */
								__( '%d issues', 'jetpack-boost' ),
								summary.issue_count
							)}
						{:else}
							{__( 'No issues', 'jetpack-boost' )}
						{/if}
					</Link>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style lang="scss">
	.jb-multi-progress {
		width: 100%;
		display: flex;
		gap: 8px;
	}
	.jb-progress {
		grid-area: progress;
	}
	.jb-entry {
		flex: 1 0;
		display: grid;
		gap: 4px;
		grid-template-columns: 30px 1fr 1fr;
		grid-template-rows: 36px 18px 18px;
		grid-template-areas:
			'progress progress progress'
			'bubble category category'
			'bubble status status';
		:global( a ) {
			text-decoration: none;
		}
	}
	.jb-bubble {
		grid-area: bubble;
		background-color: var( --gray-50 );
		color: var( --gray-0 );
		border-radius: 50%;
		width: 1.6rem;
		height: 1.6rem;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
		&.done {
			background-color: var( --jetpack-green-50 );
		}
	}
	.jb-status {
		grid-area: status;
		font-size: 0.875rem;
		:global( a ),
		&.has-issues {
			color: var( --color_warning );
		}
	}
	.jb-category-name {
		grid-area: category;
		display: flex;
	}
</style>
