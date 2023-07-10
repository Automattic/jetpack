<script lang="ts">
	import { useNavigate } from 'svelte-navigator';
	import { Link } from '../../../utils/router';
	import { isaData } from '../store/isa-data';
	import { isaGroupLabels, imageDataGroupTabs } from '../store/isa-summary';

	const navigate = useNavigate();

	let dropdownOpen = false;

	function selectGroup( group ) {
		navigate( `/image-size-analysis/${ group }/1` );
		dropdownOpen = false;
	}

	function onClickDropdown() {
		dropdownOpen = ! dropdownOpen;
	}

	$: currentTab = $imageDataGroupTabs[ $isaData.query.group ];
</script>

<div class="dropdown">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="head-bar" on:click={onClickDropdown}>
		{isaGroupLabels[ $isaData.query.group ]}
		{#if currentTab?.issue_count > 0}
			<span class="issues">{currentTab.issue_count}</span>
		{/if}
		<span class="dashicons dashicons-arrow-down-alt2" />
	</div>

	{#if dropdownOpen}
		<ul class="options">
			{#each Object.entries( $imageDataGroupTabs ) as [group, details]}
				{@const  issues = details.issue_count }

				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li
					class:active={issues > 0}
					class:selected={$isaData.query.group === group}
					on:click={() => issues > 0 && selectGroup( group )}
				>
					{isaGroupLabels[ group ]}
					<span class="issues">{issues}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

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
	.dropdown {
		/* Hide on wide screens */
		@media ( min-width: 783px ) {
			display: none;
		}

		margin-bottom: 32px;

		.head-bar {
			background-color: #fff;
			border: 1px solid #000;
			border-radius: 1px;
			padding: 8px 12px;

			.dashicons {
				float: right;
			}
		}

		ul {
			margin: 0px;
			border: 1px solid #000;
			background-color: #fff;
			padding: 8px 12px;
			color: var( --gray-10 );

			li.active {
				color: black;
			}

			li.selected {
				background-color: var( --gray-0 );
			}
		}
	}

	.jb-tabs {
		display: flex;
		border-bottom: 1px solid var( --gray-5 );
		margin-bottom: 32px;
		gap: var( --gap );

		/* Hide on narrow screens. */
		@media ( max-width: 782px ) {
			display: none;
		}
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
	.jb-tab span,
	.dropdown span.issues {
		padding: 2px 8px;
		font-size: 0.75rem;
		border-radius: var( --border-radius );
		background-color: var( --gray-5 );
	}
</style>
