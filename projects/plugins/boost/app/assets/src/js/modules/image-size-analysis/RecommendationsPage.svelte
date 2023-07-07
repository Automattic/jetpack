<script lang="ts">
	import { onMount } from 'svelte';
	import { __ } from '@wordpress/i18n';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import Hero from './recommendations/Hero.svelte';
	import Pagination from './recommendations/Pagination.svelte';
	import Table from './recommendations/Table.svelte';
	import Tabs from './recommendations/Tabs.svelte';
	import { initializeIsaData } from './store/isa-data';
	import { initializeIsaSummary } from './store/isa-summary';

	initializeIsaData();

	onMount( () => {
		initializeIsaSummary();
	} );
</script>

<div id="jb-dashboard" class="jb-dashboard">
	<Header subPage={__( 'Image analysis report', 'jetpack-boost' )} />
	<div class="recommendations-page jb-container jb-section--alt">
		<Hero />
		<Tabs />
		<Table />
		<Pagination />
		<Footer />
	</div>
</div>

<style lang="scss">
	.jb-dashboard {
		background-color: #f9f9f6;
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
	}
</style>
