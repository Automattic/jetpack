<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Button from '../../../../elements/Button.svelte';
	import { getImageSizeDifferencePercent } from '../../../../utils/get-image-size-difference-percent';
	import Device from '../components/Device.svelte';
	import Pill from '../components/Pill.svelte';
	import RowTitle from '../components/RowTitle.svelte';
	import Thumbnail from '../components/Thumbnail.svelte';
	import TableRow from './TableRow.svelte';
	import TableRowHover from './TableRowHover.svelte';
	import type { ImageDataType } from '../../store/zod-types';

	export let enableTransition: boolean;
	export let details: ImageDataType;

	const title = details.image.url.split( '/' ).pop();
	const sizeDifference = getImageSizeDifferencePercent( details.image );
	const pillColor = sizeDifference <= 30 ? '#f5e5b3' : '#facfd2';
</script>

<TableRow {enableTransition} expandable={true}>
	<svelte:fragment slot="main">
		<div class="jb-table-row__thumbnail">
			<Thumbnail {title} url={details.image.url} width={65} height={65} />
		</div>

		<div class="jb-table-row__title">
			<RowTitle {title} url={details.page.url} />
		</div>

		<div class="jb-table-row__potential-size">
			<Pill color={pillColor}>
				{Math.round( details.image.weight.current )} KB
			</Pill>

			<div class="jb-arrow">→</div>

			<Pill color="#d0e6b8">
				{Math.round( details.image.weight.potential )} KB
			</Pill>
		</div>

		<div class="jb-table-row__hover-content">
			<TableRowHover edit_url={details.page.edit_url} instructions={details.instructions} />
		</div>

		<div class="jb-table-row__device">
			<Device device={details.device_type} />
		</div>

		<div class="jb-table-row__page">
			<a href={details.page.url}>{details.page.title}</a>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="expanded">
		<div class="image-details">
			<h4>Image Details</h4>

			<div class="row">
				<div class="label">
					{__( 'File Dimensions', 'jetpack-boost' )}
				</div>
				<div class="value">
					{Math.round( details.image.dimensions.file.width )}
					x
					{Math.round( details.image.dimensions.file.height )}
					px
				</div>
			</div>

			<div class="row">
				<div class="label">
					{__( 'Expected Dimensions', 'jetpack-boost' )}
				</div>
				<div class="value">
					{Math.round( details.image.dimensions.expected.width )}
					x
					{Math.round( details.image.dimensions.expected.height )}
					px
				</div>
			</div>

			<div class="row">
				<div class="label">
					{__( 'Size on screen', 'jetpack-boost' )}
				</div>
				<div class="value">
					{Math.round( details.image.dimensions.size_on_screen.width )}
					x
					{Math.round( details.image.dimensions.size_on_screen.height )}
					px
				</div>
			</div>
		</div>

		<div class="fix-options">
			<h4>
				{__( 'How to fix', 'jetpack-boost' )}
			</h4>
			<p>{details.instructions}</p>
			<div class="jb-actions">
				<Button width="auto" href={details.page.edit_url} fill>
					{__( 'Fix on page', 'jetpack-boost' )}
				</Button>
			</div>
		</div>
	</svelte:fragment>
</TableRow>

<style lang="scss">
	.jb-table-row__thumbnail {
		grid-column: thumbnail;
	}

	.jb-table-row__title {
		grid-column: title;
	}

	.jb-table-row__hover-content {
		grid-column: device / expand;
	}

	.jb-table-row__potential-size {
		grid-column: potential-size;
		display: flex;
		align-items: center;
		gap: calc( var( --gap ) / 2 );
	}

	.jb-table-row__device {
		grid-column: device;
		text-align: center;
	}

	.jb-table-row__page {
		grid-column: page;
		a {
			text-decoration: none;
			color: var( --gray-60 );
		}
	}

	.image-details {
		flex: 1;
		max-width: 300px;
		display: flex;
		flex-direction: column;
		font-size: 0.875rem;
		gap: calc( var( --gap ) / 2 );
		h4 {
			font-weight: 600;
		}
		.row {
			display: flex;
			gap: 10px;
			justify-content: space-between;
		}
		.value {
			font-weight: 500;
		}
	}

	.jb-actions {
		display: flex;
		gap: var( --gap );
	}
	.fix-options {
		flex: 1;
		margin-left: calc( var( --table-header-potential-size ) - var( --gap ) * 2 );
	}
</style>
