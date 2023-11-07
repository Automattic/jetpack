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
