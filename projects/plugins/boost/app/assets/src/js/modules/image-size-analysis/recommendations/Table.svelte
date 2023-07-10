<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Spinner from '../../../elements/Spinner.svelte';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import { ISA_Data, isaData, isaDataLoading } from '../store/isa-data';
	import { ISAStatus, isaSummary } from '../store/isa-summary';
	import BrokenDataRow from './row-types/BrokenDataRow.svelte';
	import ImageMissingRow from './row-types/ImageMissingRow.svelte';
	import ImageSizeRow from './row-types/ImageSizeRow.svelte';
	import LoadingRow from './row-types/LoadingRow.svelte';

	$: activeFilter = $isaData.query.group === 'ignored' ? 'ignored' : 'active';

	export let needsRefresh: boolean;
	export let refresh: () => Promise< void >;

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

	function getActiveImages( images: ISA_Data[], loading: boolean ) {
		// Return no rows while loading. The UI will auto-pad it with loading rows.
		if ( loading ) {
			return [];
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
	$: jobFinished = $isaSummary?.status === ISAStatus.Completed;
</script>

<div class="jb-loading-spinner" class:active={isLoading}>
	<Spinner size="3rem" lineWidth="4px" />
</div>

{#if ! isLoading && activeImages.length === 0}
	<h1>
		{#if needsRefresh}
			<TemplatedString
				template={__(
					'<refresh>Refresh</refresh> to see the latest recommendations.',
					'jetpack-boost'
				)}
				vars={actionLinkTemplateVar( () => refresh(), 'refresh' )}
			/>
		{:else}
			{jobFinished
				? __( '🥳 No image size issues found!', 'jetpack-boost' )
				: __( 'No image size issues found yet…', 'jetpack-boost' )}
		{/if}
	</h1>
{:else}
	<div class="jb-table" class:jb-loading={isLoading}>
		<div class="jb-table-header recommendation-page-grid">
			<div class="jb-table-header__image">Image</div>
			<div class="jb-table-header__potential-size">Potential Size</div>
			<div class="jb-table-header__device">Device</div>
			<div class="jb-table-header__page">Page/Post</div>
		</div>

		{#if isLoading}
			{#each Array( 10 ) as _, i}
				<LoadingRow />
			{/each}
		{:else}
			<!-- Actual data -->
			{#each activeImages as image (image.id)}
				{#if image.type === 'image_size'}
					<ImageSizeRow enableTransition={$isaData.data.images.length > 0} details={image} />
				{:else if image.type === 'image_missing'}
					<ImageMissingRow enableTransition={$isaData.data.images.length > 0} details={image} />
				{:else}
					<BrokenDataRow />
				{/if}
			{/each}
		{/if}
	</div>
{/if}

<style lang="scss">
	.jb-table {
		will-change: opacity, filter;
		transition: opacity 0.3s ease-in-out, filter 0.3s ease-in-out;
	}

	h1 {
		padding-top: 16px;
		width: 100%;
		text-align: center;
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
		/* Hide on small screens */
		@media ( max-width: 782px ) {
			display: none;
		}

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
