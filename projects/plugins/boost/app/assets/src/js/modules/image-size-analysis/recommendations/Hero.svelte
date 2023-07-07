<script lang="ts">
	import { quadOut } from 'svelte/easing';
	import { get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { __ } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import { isaData, refreshIsaData } from '../store/isa-data';
	import { imageDataActiveGroup, totalIssueCount } from '../store/isa-summary';

	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );

	// Keep track of the total count from the summary the last time we got a data update.
	// Useful for identify when a summary change might mean we need a refresh.
	let countAtLastDataUpdate = 0;
	isaData.subscribe( () => {
		countAtLastDataUpdate = get( totalIssueCount );
	} );

	async function refresh() {
		// Don't let the UI show a refresh button until we get fresh ISA data.
		countAtLastDataUpdate = Infinity;
		await refreshIsaData();
	}

	$: needsRefresh = $totalIssueCount > countAtLastDataUpdate;
</script>

{#if $imageDataActiveGroup && $isaData.data.last_updated}
	{@const  lastUpdated = formatter.format( $isaData.data.last_updated ) }

	<div class="jb-hero" in:fade={{ duration: 300, easing: quadOut }}>
		<span>Latest report as of {lastUpdated}</span>
		{#if $imageDataActiveGroup.issue_count}
			<h1>
				{$imageDataActiveGroup.issue_count}
				Image Recommendations
			</h1>
		{/if}

		{#if needsRefresh}
			<TemplatedString
				template={__(
					'More recommendations have been found. <refresh>Refresh</refresh> to see the latest recommendations.',
					'jetpack-boost'
				)}
				vars={actionLinkTemplateVar( () => refresh(), 'refresh' )}
			/>
		{/if}
	</div>
{:else}
	<div class="jb-hero">
		<span>&nbsp;</span>
		<h1>&nbsp;</h1>
	</div>
{/if}

<style lang="scss">
	.jb-hero {
		padding: 50px 0;
		display: flex;
		flex-direction: column;
		gap: calc( var( --gap ) / 2 );
	}
</style>
