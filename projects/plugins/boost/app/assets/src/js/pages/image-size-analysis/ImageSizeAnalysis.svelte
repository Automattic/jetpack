<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { __ } from '@wordpress/i18n';
	import { Hero } from '$features/image-size-analysis/hero/hero';
	import Pagination from '$features/image-size-analysis/recommendations/pagination/pagination';
	import Table from '$features/image-size-analysis/recommendations/table/table';
	import Tabs from '$features/image-size-analysis/recommendations/tabs/tabs';
	import {
		image_size_analysis,
		initializeIsaData,
		isaData,
		isaDataLoading,
	} from '$features/image-size-analysis/lib/stores/isa-data';
	import {
		imageDataActiveGroup,
		imageDataGroupTabs,
		initializeIsaSummary,
		totalIssueCount,
		isaSummary,
	} from '$features/image-size-analysis/lib/stores/isa-summary';
	import ReactComponent from '$features/ReactComponent.svelte';
	import Footer from '$layout/footer/footer';
	import Header from '$layout/header/header';
	import { modulesState } from '$lib/stores/modules';
	import { isaGroupLabels } from '$features/image-size-analysis/lib/isa-groups';

	initializeIsaData();
	onMount( initializeIsaSummary );

	$: isImageCdnModuleActive = $modulesState.image_cdn.active;
	$: isaLastUpdated = $isaData.data.last_updated;
	$: hasActiveGroup = !! $imageDataActiveGroup;
	$: images = $isaData.data.images;
	$: activeGroup = $isaData.query.group;
	$: issueCount = $totalIssueCount;
	$: dataLoading = $isaDataLoading;
	$: summary = $isaSummary;
	$: dataGroupTabs = $imageDataGroupTabs;
</script>

<div id="jb-dashboard" class="jb-dashboard">
	<ReactComponent this={Header} subPageTitle={__( 'Image analysis report', 'jetpack-boost' )} />
	<div class="jb-recommendations-page jb-section--alt">
		<div class="jb-container">
			<ReactComponent
				this={Hero}
				{isImageCdnModuleActive}
				{isaLastUpdated}
				{hasActiveGroup}
				totalIssueCount={issueCount}
			/>
			<ReactComponent
				this={Tabs}
				{activeGroup}
				imageDataGroupTabs={dataGroupTabs}
				{isaGroupLabels}
			/>
		</div>

		<div class="jb-table-wrap">
			<ReactComponent
				this={Table}
				isaDataLoading={dataLoading}
				{activeGroup}
				{images}
				isaSummary={summary}
			/>
		</div>

		<div class="jb-container">
			<ReactComponent
				this={Pagination}
				group={$isaData.query.group}
				current={$isaData.query.page}
				total={$isaData.data.total_pages}
			/>
			<ReactComponent this={Footer} />
		</div>
	</div>
</div>
