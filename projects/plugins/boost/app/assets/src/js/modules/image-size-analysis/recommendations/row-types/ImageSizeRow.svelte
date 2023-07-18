<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Button from '../../../../elements/Button.svelte';
	import { recordBoostEventAndRedirect } from '../../../../utils/analytics';
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
	const currentSize = details.image.weight.current;
	const potentialSavings = Math.max(
		0,
		Math.min( currentSize - 2, details.image.weight.potential )
	);
	const potentialSize = potentialSavings > 0 ? Math.round( currentSize - potentialSavings ) : '?';

	const sizeDifference = ( potentialSavings / currentSize ) * 100;
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
				{potentialSize} KB
			</Pill>
		</div>

		<div class="jb-table-row__hover-content">
			<TableRowHover
				device_type={details.device_type}
				edit_url={details.page.edit_url}
				instructions={details.instructions}
			/>
		</div>

		<div class="jb-table-row__device">
			<Device device={details.device_type} />
		</div>

		<div class="jb-table-row__page">
			<a href={details.page.url}>{details.page.title}</a>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="expanded">
		<div class="expanded-info mobile-only">
			<h4>{__( 'Potential Size', 'jetpack-boost' )}</h4>

			<div class="pills">
				<Pill color={pillColor}>
					{Math.round( details.image.weight.current )} KB
				</Pill>

				<div class="jb-arrow">→</div>

				<Pill color="#d0e6b8">
					{potentialSize} KB
				</Pill>
			</div>
		</div>

		<div class="expanded-info mobile-only">
			<h4>{__( 'Device', 'jetpack-boost' )}</h4>

			<div class="icon">
				<Device device={details.device_type} />
			</div>

			<span>
				{details.device_type === 'desktop'
					? __( 'This issue affects large screens', 'jetpack-boost' )
					: __( 'This issue affects small screens', 'jetpack-boost' )}
			</span>
		</div>

		<div class="expanded-info image-details">
			<h4>{__( 'Image Details', 'jetpack-boost' )}</h4>

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

		<div class="expanded-info fix-options">
			<h4>
				{__( 'How to fix', 'jetpack-boost' )}
			</h4>
			<p>{details.instructions}</p>
			{#if details.page.edit_url}
				<div class="jb-actions">
					<Button
						width="auto"
						fill
						on:click={() =>
							recordBoostEventAndRedirect(
								details.page.edit_url,
								'clicked_fix_on_page_on_isa_report',
								{ device_type: details.device_type }
							)}
					>
						{__( 'Fix on page', 'jetpack-boost' )}
					</Button>
				</div>
			{/if}
		</div>
	</svelte:fragment>
</TableRow>

<style lang="scss">
	.mobile-only {
		display: none;

		@media ( max-width: 782px ) {
			display: block;
		}
	}

	.pills {
		grid-column: potential-size;
		display: flex;
		align-items: center;
		gap: calc( var( --gap ) / 2 );
	}

	h4 {
		font-size: 16px;
		font-weight: 600;
	}

	.expanded-info {
		@media ( max-width: 782px ) {
			margin-bottom: 16px;

			h4 {
				margin-bottom: 12px;
			}

			.icon {
				margin-right: 12px;
				display: inline-block;
				aspect-ratio: 1;
			}
		}
	}

	.image-details {
		flex: 1;
		max-width: 300px;
		display: flex;
		flex-direction: column;
		font-size: 0.875rem;
		gap: calc( var( --gap ) / 2 );
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

		@media ( max-width: 782px ) {
			margin-left: 0;
		}
	}
</style>
