<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Device from '../components/Device.svelte';
	import Pill from '../components/Pill.svelte';
	import RowTitle from '../components/RowTitle.svelte';
	import TableRow from './TableRow.svelte';
	import TableRowHover from './TableRowHover.svelte';
	import type { ImageDataType } from '../../store/zod-types';

	export let enableTransition: boolean;
	export let details: ImageDataType;

	const title = details.image.url.split( '/' ).pop();
</script>

<TableRow {enableTransition} expandable={false}>
	<svelte:fragment slot="main">
		<div class="jb-table-row__thumbnail">
			{__( 'Missing Image', 'jetpack-boost' )}
		</div>

		<div class="jb-table-row__title">
			<RowTitle {title} url={details.page.url} />
		</div>

		<div class="jb-table-row__potential-size">
			<Pill color="#facfd2">? KB</Pill>

			<div class="jb-arrow">→</div>

			<Pill color="#d0e6b8">? KB</Pill>
		</div>

		<div class="jb-table-row__hover-content">
			<TableRowHover
				edit_url={details.page.edit_url}
				instructions={__(
					'This image does not appear to load. Please check the URL in the relevant page.',
					'jetpack-boost'
				)}
			/>
		</div>

		<div class="jb-table-row__device">
			<Device device={details.device_type} />
		</div>

		<div class="jb-table-row__page">
			<a href={details.page.url}>{details.page.title}</a>
		</div>
	</svelte:fragment>
</TableRow>

<style lang="scss">
	.jb-table-row__thumbnail {
		grid-column: thumbnail;
		border-radius: 10px;
		border: 3px solid #999;
		color: #666;
		text-align: center;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 80%;
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
