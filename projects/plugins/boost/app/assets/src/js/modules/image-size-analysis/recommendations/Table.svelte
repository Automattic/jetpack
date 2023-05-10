<script lang="ts">
	import Spinner from '../../../elements/Spinner.svelte';
	import { isaFilteredImages, isaDataLoading } from '../store/isa-data';
	import TableRow from './TableRow.svelte';
</script>

<div class="jb-table" class:jb-loading={$isaDataLoading}>
	<div class="jb-table-header recommendation-page-grid">
		<div class="jb-table-header__image">Image</div>
		<div class="jb-table-header__potential-size">Potential Size</div>
		<div class="jb-table-header__device">Device</div>
		<div class="jb-table-header__page">Page/Post</div>
	</div>

	<div class="jb-loading-spinner">
		<Spinner size="3rem" lineWidth="4px" />
	</div>

	{#each $isaFilteredImages as data (data.id)}
		<TableRow {data} />
	{/each}
</div>

<style lang="scss">
	.jb-table {
		will-change: opacity, filter;
		transition: opacity 0.3s ease-in-out, filter 0.3s ease-in-out;
	}
	.jb-loading {
		filter: grayscale( 0.5 );
		opacity: 0.2;
		position: relative;
	}
	:not( .jb-loading ) .jb-loading-spinner {
		display: none;
	}
	.jb-loading .jb-loading-spinner {
		position: absolute;
		top: 25%;
		left: 50%;
		transform: translate( -50%, -50% );
		z-index: 9000;
	}
	.jb-table-header {
		font-size: 0.875rem;
		color: var( --gray-60 );
		border: var( --border );
		border-top-left-radius: var( --border-radius );
		border-top-right-radius: var( --border-radius );
		border-bottom: 0;
		background-color: #fff;
	}

	.jb-table-header__image {
		grid-column: thumbnail / title;
	}
	.jb-table-header__device {
		grid-column: device;
		text-align: center;
	}
	.jb-table-header__potential-size {
		grid-column: potential-size;
	}
	.jb-table-header__page {
		grid-column: page / expand;
	}
</style>
