<script lang="ts">
	import { imageData, imagesAreLoading } from '../datasync-image-size-analysis';
	import TableRow from './TableRow.svelte';
</script>

<div class="jb-table" class:jb-loading={$imagesAreLoading}>
	<div class="jb-table-header recommendation-page-grid">
		<div class="jb-table-header__image">Image</div>
		<div class="jb-table-header__potential-size">Potential Size</div>
		<div class="jb-table-header__device">Device</div>
		<div class="jb-table-header__page">Page/Post</div>
	</div>
	{#each $imageData.data.images as data (data.image.url)}
		<TableRow {data} />
	{/each}
</div>

<style lang="scss">
	.jb-loading {
		filter: grayscale( 0.5 );
		opacity: 0.5;
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
