<script lang="ts">
	import { useNavigate } from 'svelte-navigator';
	import { recordBoostEvent } from '../../../utils/analytics';
	import { Link } from '../../../utils/router';
	import { type ISASummaryGroup } from '../store/isa-summary';

	export let activeGroup: string;
	export let imageDataGroupTabs: Record< string, ISASummaryGroup >;
	export let isaGroupLabels;

	const navigate = useNavigate();

	let dropdownOpen = false;

	function selectGroup( group ) {
		navigate( `/image-size-analysis/${ group }/1` );
		dropdownOpen = false;
	}

	function onClickDropdown() {
		dropdownOpen = ! dropdownOpen;
	}

	$: currentTab = imageDataGroupTabs[ activeGroup ];
</script>

<div class="jb-dropdown">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="jb-dropdown__head-bar" on:click={onClickDropdown}>
		{isaGroupLabels[ activeGroup ]}
		{#if currentTab?.issue_count > 0}
			<span class="jb-dropdown__issues">{currentTab.issue_count}</span>
		{/if}
		<span class="dashicons dashicons-arrow-down-alt2" />
	</div>

	{#if dropdownOpen}
		<ul class="jb-dropdown__options">
			{#each Object.entries( imageDataGroupTabs ) as [group, details]}
				{@const ( issues = details.issue_count )}

				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li
					class:active={issues > 0}
					class:selected={activeGroup === group}
					on:click={() => issues > 0 && selectGroup( group )}
				>
					{isaGroupLabels[ group ]}
					<span class="jb-dropdown__issues">{issues}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<div class="jb-tabs">
	{#each Object.entries( imageDataGroupTabs ) as [group, details]}
		{@const ( label = isaGroupLabels[ group ] )}
		{@const ( issues = details.issue_count )}

		<div class="jb-tab jb-tab--{group}" class:active={activeGroup === group}>
			<div class="jb-tab__header">
				{#if issues > 0}
					<Link
						class="jb-navigator-link"
						to="/image-size-analysis/{group}/1"
						on:click={() => recordBoostEvent( 'clicked_isa_report_group', { group } )}
					>
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
