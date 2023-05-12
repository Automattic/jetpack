<script lang="ts">
	import { quadOut } from 'svelte/easing';
	import { fade, slide } from 'svelte/transition';
	import { ISA_Data } from '../store/isa-data';
	import TableRowExpanded from './TableRowExpanded.svelte';
	import TableRowHover from './TableRowHover.svelte';
	import Device from './components/Device.svelte';
	import Pill from './components/Pill.svelte';
	import RowTitle from './components/RowTitle.svelte';
	import Thumbnail from './components/Thumbnail.svelte';

	export let status: ISA_Data[ 'status' ];
	export let title: string;
	export let image_url: string;
	export let page_url: string;
	export let weight: ISA_Data[ 'image' ][ 'weight' ];
	export let device_type: ISA_Data[ 'device_type' ];
	export let page_title: string;
	export let dimensions: ISA_Data[ 'image' ][ 'dimensions' ];
	export let edit_url: string;
	export let instructions: string;
	export let enableTransition: boolean;

	let expanded = false;
	function toggleExpand( e ) {
		// Don't expand if the user clicked a link or a button.
		if ( e.target.tagName === 'A' || e.target.tagName === 'BUTTON' ) {
			return;
		}
		expanded = ! expanded;
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="jb-table-row-container"
	out:slide={{ duration: enableTransition ? 250 : 0, easing: quadOut }}
	class:expanded
>
	<div class="jb-table-row recommendation-page-grid" on:click={toggleExpand}>
		<div class="jb-table-row__thumbnail">
			<Thumbnail {title} url={image_url} width={65} height={65} />
		</div>

		<div class="jb-table-row__title">
			<RowTitle {title} url={page_url} />
		</div>

		<div class="jb-table-row__potential-size">
			<Pill color="#facfd2">
				{Math.round( weight.current )} KB
			</Pill>
			<div class="jb-arrow">→</div>
			<Pill color="#d0e6b8">
				{Math.round( weight.potential )} KB
			</Pill>
		</div>

		<div class="jb-table-row__hover-content">
			<TableRowHover {edit_url} {instructions} />
		</div>

		<div class="jb-table-row__device">
			<Device device={device_type} />
		</div>

		<div class="jb-table-row__page">
			<a href={page_url}>{page_title}</a>
		</div>

		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="jb-table-row__expand">
			<svg
				width="16"
				height="10"
				viewBox="0 0 16 10"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0.667349 1.33325L8.00068 7.99992L15.334 1.33325"
					stroke="#1E1E1E"
					stroke-width="1.5"
				/>
			</svg>
		</div>
	</div>
	{#if expanded}
		<TableRowExpanded {...{ status, dimensions, edit_url, instructions }} on:clickIgnore />
	{/if}
</div>

<style lang="scss">
	.jb-table-row-container {
		background-color: #fff;
		border-top: var( --border );
		border-left: var( --border );
		border-right: var( --border );
		margin: 0;
		transition: margin 100ms ease;

		// This is a workaround for box shadows.
		// If the shadow was applied to the row directly
		// it would cast a shadow on other rows
		// This puts the shadow on a pseudo element
		// and moves it behind the row
		// The downside of this approach is that I can't use
		// overflow: hidden to clip border radius here.
		position: relative;
		&:before {
			content: '';
			position: absolute;
			box-shadow: 0px 4px 24px 0px hsla( 0, 0%, 0%, 0.08 );
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: -1;
		}

		&:last-child {
			border-bottom-right-radius: var( --border-radius );
			border-bottom-left-radius: var( --border-radius );
			border-bottom: var( --border );
		}
	}

	.expanded {
		margin-bottom: var( --expanded-gap );
		border-bottom-right-radius: var( --border-radius );
		border-bottom-left-radius: var( --border-radius );
		border-bottom: var( --border );
	}

	// Expanded view, but not the one at the very top.
	:global( :not( .jb-table-header ) + .jb-table-row-container.expanded ) {
		margin-top: var( --expanded-gap );
		border-top-right-radius: var( --border-radius );
		border-top-left-radius: var( --border-radius );
	}

	// The row after the expanded view.
	:global( .expanded + .jb-table-row-container ) {
		border-top-right-radius: var( --border-radius );
		border-top-left-radius: var( --border-radius );
	}

	// The row before the expanded view.
	:global( .jb-table-row-container:has( + .expanded ) ) {
		border-bottom-right-radius: var( --border-radius );
		border-bottom-left-radius: var( --border-radius );
		border-bottom: var( --border );
	}

	.jb-table-row {
		min-height: 115px;
		cursor: pointer;

		.jb-table-row__hover-content {
			display: none;
		}

		&:hover {
			background-color: #f6f7f7;

			// Can't use overflow because of the box-shadow workaround above.
			// So instead, repeating the border radius.
			.expanded & {
				border-top-right-radius: var( --border-radius );
				border-top-left-radius: var( --border-radius );
			}
			.jb-table-row__hover-content {
				display: block;
			}
			.jb-table-row__device,
			.jb-table-row__page {
				display: none;
			}
		}
	}
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
	.jb-table-row__expand {
		cursor: pointer;
		text-align: center;
		grid-column: expand;
		.expanded & {
			svg {
				transform: rotate( 180deg );
			}
		}
	}
</style>
