<script lang="ts">
	import Spinner from '../../../elements/Spinner.svelte';
	import { ISA_Data, isaData, isaDataLoading } from '../store/isa-data';
	import { getPreloadingImages } from '../store/preloading-image';
	import BrokenDataRow from './row-types/BrokenDataRow.svelte';
	import ImageMissingRow from './row-types/ImageMissingRow.svelte';
	import ImageSizeRow from './row-types/ImageSizeRow.svelte';

	$: activeFilter = $isaData.query.group === 'ignored' ? 'ignored' : 'active';

	let isLoading = false;
	let ignoreStatusUpdated = false;
	async function delayedLoadingUpdate( loading: boolean ) {
		if ( ignoreStatusUpdated ) {
			ignoreStatusUpdated = false;
			return;
		}
		isLoading = loading;
	}
	$: delayedLoadingUpdate( $isaDataLoading );

	const preloadingImages = getPreloadingImages( 10 );

	function getActiveImages( images: ISA_Data[], loading: boolean ) {
		// If the global store has no images right now, we're fetching them from wpcom
		if ( images.length === 0 ) {
			return preloadingImages;
		}

		// If the user is switching between tabs, we want to show the images that are already loaded
		const filteredImages = images.filter( image => image.status === activeFilter );
		if ( filteredImages.length === 0 && loading ) {
			return images;
		}

		// Show filtered images
		return filteredImages;
	}

	$: activeImages = getActiveImages( $isaData.data.images, isLoading );
</script>

<div class="jb-loading-spinner" class:active={isLoading}>
	<Spinner size="3rem" lineWidth="4px" />
</div>
<div class="jb-table" class:jb-loading={isLoading}>
	<div class="jb-table-header recommendation-page-grid">
		<div class="jb-table-header__image">Image</div>
		<div class="jb-table-header__potential-size">Potential Size</div>
		<div class="jb-table-header__device">Device</div>
		<div class="jb-table-header__page">Page/Post</div>
	</div>

	{#each activeImages as image (image.id)}
		{#if image.type === 'image_size'}
			<ImageSizeRow enableTransition={$isaData.data.images.length > 0} details={image} />
		{:else if image.type === 'image_missing'}
			<ImageMissingRow enableTransition={$isaData.data.images.length > 0} details={image} />
		{:else}
			<BrokenDataRow />
		{/if}
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
	.jb-loading-spinner {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate( -50%, -50% );
		z-index: 9000;
		&:not( .active ) {
			display: none;
		}
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
