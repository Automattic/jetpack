<script lang="ts">
	import { ImageMeta } from '../ApiMock';
	import TableRowExpanded from './TableRowExpanded.svelte';
	import TableRowHover from './TableRowHover.svelte';
	import Device from './components/Device.svelte';
	import Pill from './components/Pill.svelte';
	import RowTitle from './components/RowTitle.svelte';
	import Thumbnail from './components/Thumbnail.svelte';

	export let data: ImageMeta;
	let expanded = false;
	let hover = Math.random() > 0.5;
	const title = data.image.url.split( '/' ).pop();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="jb-table-row"
	on:mouseenter={() => ( hover = true )}
	on:mouseleave={() => ( hover = false )}
	on:click={() => ( expanded = ! expanded )}
>
	<div class="jb-table-row__thumbnail">
		<Thumbnail {title} url={data.image.url} width={65} height={65} />
	</div>

	<div class="jb-table-row__title">
		<RowTitle {title} url={data.page.url} />
	</div>

	<div class="jb-table-row__potential-size">
		<Pill color="#facfd2">
			{Math.round( data.image.weight.current )} KB
		</Pill>
		<div class="jb-arrow">→</div>
		<Pill color="#d0e6b8">
			{Math.round( data.image.weight.potential )} KB
		</Pill>
	</div>

	<div class="jb-table-row__hover-content">
		<TableRowHover />
	</div>

	<div class="jb-table-row__device">
		<Device device={data.device_type} />
	</div>

	<div class="jb-table-row__page">
		<a href={data.page.url}>{data.page.title}</a>
	</div>

	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="jb-table-row__expand" on:click={() => ( expanded = ! expanded )}>
		<span>{expanded ? '▲' : '▼'}</span>
	</div>
</div>

{#if expanded}
	<TableRowExpanded image={data.image} instructions={data.instructions} />
{/if}

<style lang="scss">
	.jb-table-row {
		display: flex;
		align-items: center;
		height: 110px;
		gap: var( --gap );
		padding: var( --padding );
		border-bottom: var( --border );
		cursor: pointer;

		.jb-table-row__hover-content {
			display: none;
		}
		&:hover {
			background-color: #f6f7f7;
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
		width: 65px;
	}
	.jb-table-row__title {
		// header - thumbnail - gap
		width: var( --table-column-title );
	}
	.jb-table-row__hover-content {
		width: calc(
			var( --table-column-potential-size ) + var( --table-column-device ) +
				var( --table-column-expand )
		);
	}
	.jb-table-row__potential-size {
		width: var( --table-column-potential-size );

		display: flex;
		align-items: center;
		gap: calc( var( --gap ) / 2 );
	}

	.jb-table-row__device {
		width: var( --table-column-device );
		text-align: center;
	}
	.jb-table-row__page {
		flex-grow: 1;
		a {
			text-decoration: none;
			color: var( --gray-60 );
		}
	}
	.jb-table-row__expand {
		cursor: pointer;
		margin-left: auto;
		text-align: right;
		width: var( --table-column-expand );
	}
</style>
