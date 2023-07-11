<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { __ } from '@wordpress/i18n';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import Hero from './recommendations/Hero.svelte';
	import Pagination from './recommendations/Pagination.svelte';
	import Table from './recommendations/Table.svelte';
	import Tabs from './recommendations/Tabs.svelte';
	import { initializeIsaData, isaData, refreshIsaData } from './store/isa-data';
	import { initializeIsaSummary, totalIssueCount } from './store/isa-summary';

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

	async function refresh() {
		// Don't let the UI show a refresh button until we get fresh ISA data.
		countAtLastDataUpdate = Infinity;
		await refreshIsaData();
	}
</script>

<div id="jb-dashboard" class="jb-dashboard">
	<Header subPage={__( 'Image analysis report', 'jetpack-boost' )} />
	<div class="recommendations-page jb-section--alt">
		<div class="jb-container">
			<Hero {needsRefresh} {refresh} />
			<Tabs />
		</div>

		<div class="table-wrap">
			<Table {needsRefresh} {refresh} />
		</div>

		<div class="jb-container">
			<Pagination />
			<Footer />
		</div>
	</div>
</div>

<style lang="scss">
	.jb-dashboard {
		background-color: #f9f9f6;
	}

	.table-wrap {
		width: 87.5%;
		margin-left: auto;
		margin-right: auto;

		@media ( max-width: 782px ) {
			width: 100%;
		}
	}

	.recommendations-page {
		// Table
		--gap: 16px;
		--expanded-gap: 8px;
		--padding: 16px;
		--border-radius: 4px;

		--thumbnail-size: 65px;
		--border: 1px solid #ddd;

		// Table Columns: Headers
		--table-header-image: calc(
			var( --table-column-title ) + var( --thumbnail-size ) + var( --gap )
		);
		--table-header-device: 10%;
		--table-header-potential-size: 15%;

		// Table Columns: Content
		--table-column-device: var( --table-header-device );
		--table-column-expand: 65px;
		--table-column-title: 33%;
		--table-column-potential-size: var( --table-header-potential-size );

		line-height: 1.5;
		-webkit-font-smoothing: antialiased;

		/**
		 * Narrow screen overrides.
		 */
		@media ( max-width: 782px ) {
			--expanded-gap: 0px;
			--border-radius: 0px;
			--table-column-expand: 32px;
		}
	}

	:global( .recommendation-page-grid ) {
		display: grid;
		padding: var( --padding );
		gap: var( --gap );
		align-items: center;
		grid-template-columns:
			[thumbnail] var( --thumbnail-size )
			[title] var( --table-column-title )
			[potential-size] var( --table-column-potential-size )
			[device] var( --table-column-device )
			[page] 1fr
			[expand] var( --table-column-expand );

		/**
		 * Narrow screen overrides.
		 */
		@media ( max-width: 782px ) {
			// Remove some columns
			grid-template-columns:
				[thumbnail] var( --thumbnail-size )
				[title] 1fr
				[expand] var( --table-column-expand );
		}
	}
</style>
