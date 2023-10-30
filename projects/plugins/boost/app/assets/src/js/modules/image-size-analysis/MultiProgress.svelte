<script lang="ts">
	import { sprintf, __ } from '@wordpress/i18n';
	import ConditionalLink from '../../elements/ConditionalLink.svelte';
	import OtherGroupContext from '../../elements/OtherGroupContext.svelte';
	import ProgressBar from '../../elements/ProgressBar.svelte';
	import Spinner from '../../elements/Spinner.svelte';
	import WarningIcon from '../../svg/warning-outline.svg';
	import { isaGroupLabel } from './store/isa-summary';

	export let summaryProgress: {
		group: string;
		issue_count?: number;
		scanned_pages?: number;
		total_pages?: number;
		progress: number;
		done: boolean;
		has_issues: boolean;
	}[];
</script>

<div class="jb-multi-progress">
	{#each summaryProgress as summary, index}
		<div class="jb-entry">
			<div class="jb-progress">
				<ProgressBar progress={summary.progress} />
			</div>

			{#if summary.progress > 0 && summary.progress < 100}
				<Spinner />
			{:else}
				<ConditionalLink
					isLink={summary.has_issues}
					class="jb-navigator-link"
					to="/image-size-analysis/{summary.group}/1"
					trackEvent="clicked_isa_group_on_summary_page"
					trackEventProps={summary.group}
				>
					<span class="jb-bubble" class:done={summary.done} class:has-issues={summary.has_issues}>
						{#if summary.has_issues}
							<WarningIcon class="icon" />
						{:else}
							{summary.done ? '✓' : index + 1}
						{/if}
					</span>
				</ConditionalLink>
			{/if}

			<div class="jb-category-name">
				<ConditionalLink
					isLink={summary.has_issues}
					class="jb-navigator-link"
					to="/image-size-analysis/{summary.group}/1"
					trackEvent="clicked_isa_group_on_summary_page"
					trackEventProps={summary.group}
				>
					{isaGroupLabel( summary.group )}
				</ConditionalLink>
				{#if 'other' === summary.group}
					<OtherGroupContext />
				{/if}
			</div>

			{#if summary.done || summary.has_issues}
				<div class="jb-status" class:has-issues={summary.has_issues}>
					<ConditionalLink
						isLink={summary.has_issues}
						class="jb-navigator-link"
						to="/image-size-analysis/{summary.group}/1"
						trackEvent="clicked_isa_group_on_summary_page"
						trackEventProps={summary.group}
					>
						{#if summary.has_issues}
							{sprintf(
								/* translators: %d is the number of items in this list hidden behind this link */
								__( '%d issues', 'jetpack-boost' ),
								summary.issue_count
							)}
						{:else}
							{__( 'No issues', 'jetpack-boost' )}
						{/if}
					</ConditionalLink>
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

		@media ( max-width: 782px ) {
			flex-direction: column;
		}
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
		&.has-issues {
			background: transparent;
		}
	}
	.jb-status {
		grid-area: status;
		font-size: 0.875rem;
		color: var( --gray-50 );
	}
	.jb-category-name {
		grid-area: category;
		display: flex;

		:global( .jb-score-context ) {
			top: 2px;
		}

		:global( .jb-score-context__info-icon ) {
			width: 14px;
			height: 14px;
			font-size: 10px;
		}

		:global( .jb-score-context__info-container ) {
			top: 24px;
			@media ( min-width: 782px ) {
				left: -112px;
			}
			@media ( max-width: 782px ) {
				left: 112px;
			}
		}

		:global( .jb-score-context__info-container i ) {
			@media ( max-width: 782px ) {
				left: 41px;
			}
		}
	}
</style>
