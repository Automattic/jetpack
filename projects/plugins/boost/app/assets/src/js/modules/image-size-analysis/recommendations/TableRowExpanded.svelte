<script lang="ts">
	import { quadOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { __ } from '@wordpress/i18n';
	import Button from '../../../elements/Button.svelte';
	import { ISA_Data } from '../store/isa-data';

	export let dimensions: ISA_Data[ 'image' ][ 'dimensions' ];
	export let edit_url: string;
	export let instructions: string;
</script>

<div class="table-row-expanded" transition:slide|local={{ duration: 100, easing: quadOut }}>
	<div class="image-details">
		<h4>Image Details</h4>

		<div class="row">
			<div class="label">
				{__( 'File Dimensions', 'jetpack-boost' )}
			</div>
			<div class="value">
				{Math.round( dimensions.file.width )}
				x
				{Math.round( dimensions.file.height )}
				px
			</div>
		</div>

		<div class="row">
			<div class="label">
				{__( 'Expected Dimensions', 'jetpack-boost' )}
			</div>
			<div class="value">
				{Math.round( dimensions.expected.width )}
				x
				{Math.round( dimensions.expected.height )}
				px
			</div>
		</div>

		<div class="row">
			<div class="label">
				{__( 'Size on screen', 'jetpack-boost' )}
			</div>
			<div class="value">
				{Math.round( dimensions.size_on_screen.width )}
				x
				{Math.round( dimensions.size_on_screen.height )}
				px
			</div>
		</div>
	</div>

	<div class="fix-options">
		<h4>
			{__( 'How to fix', 'jetpack-boost' )}
		</h4>
		<p>{instructions}</p>
		<div class="jb-actions">
			<Button width="auto" href={edit_url} fill>
				{__( 'Fix on page', 'jetpack-boost' )}
			</Button>
		</div>
	</div>
</div>

<style lang="scss">
	.table-row-expanded {
		display: flex;
		justify-content: space-between;
		padding: var( --gap );
		padding-left: calc( var( --thumbnail-size ) + var( --gap ) * 2 );
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
