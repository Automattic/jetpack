<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { __ } from '@wordpress/i18n';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import { modulesState } from '../../stores/modules';
	import Hero from './recommendations/Hero.svelte';
	import Pagination from './recommendations/Pagination.svelte';
	import Table from './recommendations/Table.svelte';
	import Tabs from './recommendations/Tabs.svelte';
	import { initializeIsaData, isaData, isaDataLoading, refreshIsaData } from './store/isa-data';
	import {
		isaGroupLabels,
		imageDataActiveGroup,
		imageDataGroupTabs,
		initializeIsaSummary,
		totalIssueCount,
		isaSummary,
	} from './store/isa-summary';

	initializeIsaData();

	onMount( () => {
		initializeIsaSummary();
	} );

	// Keep track of the total count from the summary the last time we got a data update.
	// Useful for identify when a summary change might mean we need a refresh.
	let countAtLastDataUpdate = 0;
	isaData.subscribe( () => {
		countAtLastDataUpdate = get( totalIssueCount );
	} );

	$: needsRefresh = $totalIssueCount > countAtLastDataUpdate;
	$: isImageCdnModuleActive = $modulesState.image_cdn.active;
	$: isaLastUpdated = $isaData.data.last_updated;
	$: hasActiveGroup = !! $imageDataActiveGroup;
	$: images = $isaData.data.images;
	$: activeGroup = $isaData.query.group;
	$: issueCount = $totalIssueCount;
	$: dataLoading = $isaDataLoading;
	$: summary = $isaSummary;
	$: dataGroupTabs = $imageDataGroupTabs;

	async function refresh() {
		// Don't let the UI show a refresh button until we get fresh ISA data.
		countAtLastDataUpdate = Infinity;
		await refreshIsaData();
	}
</script>

<div id="jb-dashboard" class="jb-dashboard">
	<Header subPage={__( 'Image analysis report', 'jetpack-boost' )} />
	<div class="jb-recommendations-page jb-section--alt">
		<div class="jb-container">
			<Hero
				{needsRefresh}
				{refresh}
				{isImageCdnModuleActive}
				{isaLastUpdated}
				{hasActiveGroup}
				totalIssueCount={issueCount}
			/>
			<Tabs {activeGroup} imageDataGroupTabs={dataGroupTabs} {isaGroupLabels} />
		</div>

		<div class="jb-table-wrap">
			<Table
				{needsRefresh}
				{refresh}
				isaDataLoading={dataLoading}
				{activeGroup}
				{images}
				isaSummary={summary}
			/>
		</div>

		<div class="jb-container">
			<Pagination
				group={$isaData.query.group}
				current={$isaData.query.page}
				total={$isaData.data.total_pages}
			/>
			<Footer />
		</div>
	</div>
</div>
