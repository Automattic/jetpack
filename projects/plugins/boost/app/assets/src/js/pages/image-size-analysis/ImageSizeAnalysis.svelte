<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { __ } from '@wordpress/i18n';
	import { Hero } from '$features/image-size-analysis/hero/hero';
	import Pagination from '$features/image-size-analysis/recommendations/Pagination.svelte';
	import Table from '$features/image-size-analysis/recommendations/Table.svelte';
	import Tabs from '$features/image-size-analysis/recommendations/Tabs.svelte';
	import {
		initializeIsaData,
		isaData,
		isaDataLoading,
		refreshIsaData,
	} from '$features/image-size-analysis/store/isa-data';
	import {
		isaGroupLabels,
		imageDataActiveGroup,
		imageDataGroupTabs,
		initializeIsaSummary,
		totalIssueCount,
		isaSummary,
	} from '$features/image-size-analysis/store/isa-summary';
	import ReactComponent from '$features/ReactComponent.svelte';
	import Footer from '$layout/the-footer/Footer';
	import Header from '$layout/the-header/Header';
	import { modulesState } from '$lib/stores/modules';

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
	<ReactComponent this={Header} subPageTitle={__( 'Image analysis report', 'jetpack-boost' )} />
	<div class="jb-recommendations-page jb-section--alt">
		<div class="jb-container">
			<ReactComponent
				this={Hero}
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
			<ReactComponent this={Footer} />
		</div>
	</div>
</div>
