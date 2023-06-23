<script lang="ts">
	import { Link } from '../../../utils/router';
	import { isaData } from '../store/isa-data';
	import { isaGroupLabels, imageDataGroupTabs } from '../store/isa-summary';
</script>

<div class="jb-tabs">
	{#each Object.entries( $imageDataGroupTabs ) as [group, details]}
		{@const  label = isaGroupLabels[ group ] }
		{@const  issues = details.issue_count }

		<div class="jb-tab jb-tab--{group}" class:active={$isaData.query.group === group}>
			<div class="jb-tab__header">
				{#if issues > 0}
					<Link class="jb-navigator-link" to="/image-size-analysis/{group}/1">
						{label}
						<span>{issues}</span>
					</Link>
				{:else}
					<div class="jb-navigator-link jb-navigator-link--inactive">
						{label}
						<span>{issues}</span>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	.jb-tabs {
		display: flex;
		border-bottom: 1px solid var( --gray-5 );
		margin-bottom: 32px;
		gap: var( --gap );
	}

	.jb-tab {
		min-width: 100px;
		display: flex;
		justify-content: center;
		margin-bottom: -1px; // offset border
		border-bottom: 1px solid transparent;
		&.active {
			border-bottom: 1px solid black;
		}
	}

	.jb-tab--ignored {
		margin-left: auto;
	}

	.jb-tab:hover,
	.jb-tab:focus-within {
		border-bottom: 1px solid var( --gray-40 );
	}

	.jb-tabs :global( .jb-navigator-link ) {
		background: none;
		padding: 10px 16px;
		border: 0;
		cursor: pointer;
		text-decoration: none;

		display: flex;
		gap: 10px;
		align-items: center;
		justify-content: center;
		outline: 0;
		box-shadow: none;
	}
	.jb-navigator-link--inactive {
		opacity: 0.5;
		cursor: default;
	}
	.jb-tab span {
		padding: 2px 8px;
		font-size: 0.75rem;
		border-radius: var( --border-radius );
		background-color: var( --gray-5 );
	}
</style>
