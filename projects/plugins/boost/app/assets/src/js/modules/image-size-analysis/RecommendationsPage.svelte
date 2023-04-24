<script lang="ts">
	import Header from './recommendations/Header.svelte';
	import Pagination from './recommendations/Pagination.svelte';
	import Table from './recommendations/Table.svelte';
</script>

<div class="recommendations-page jb-container">
	<Header />
	<Table />
	<Pagination />
</div>

<style lang="scss">
	.recommendations-page {
		display: grid;
		gap: 1rem;

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
		padding: var( --padding );
		display: grid;
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
