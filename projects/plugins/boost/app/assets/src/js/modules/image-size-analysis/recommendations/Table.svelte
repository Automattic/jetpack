<script lang="ts">
	import { imageStore } from '../ApiMock';
	import TableRow from './TableRow.svelte';
</script>

<div class="jb-table">
	<div class="jb-table-header">
		<div class="jb-table-header__image">Image</div>
		<div class="jb-table-header__potential-size">Potential Size</div>
		<div class="jb-table-header__device">Device</div>
		<div class="jb-table-header__page">Page/Post</div>
	</div>
	{#each $imageStore as data}
		<TableRow {data} />
	{/each}
</div>

<style lang="scss">
	:global( .jb-section--main ) {
		background-color: #f9f9f6;
	}
	.jb-table {
		border: var( --border );
		border-radius: var( --border-radius );
		box-shadow: 0px 4px 24px rgba( 0, 0, 0, 0.08 );
		background-color: #fff;
	}
	.jb-table-header {
		display: flex;
		gap: var( --gap );
		padding: var( --padding );
		justify-content: space-between;
		font-size: 0.875rem;
		color: var( --gray-60 );
		border-bottom: var( --border );
	}

	.jb-table-header__image {
		width: var( --table-header-image );
	}
	.jb-table-header__device {
		width: var( --table-header-device );
		text-align: center;
	}
	.jb-table-header__potential-size {
		width: var( --table-header-potential-size );
	}
	.jb-table-header__page {
		flex-grow: 1;
	}
</style>
