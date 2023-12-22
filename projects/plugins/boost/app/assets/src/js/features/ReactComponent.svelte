<script lang="ts">
	/* eslint-disable import/no-unresolved */
	import React from 'react';
	import { afterUpdate, onDestroy } from 'svelte';
	import * as WPElement from '@wordpress/element';
	let container: HTMLDivElement;
	let root;
	export let inline = false;
	afterUpdate( () => {
		const { this: component, children, inline: inlineProp, ...otherProps } = $$props;
		inline = inlineProp;

		if ( ! root ) {
			root = WPElement.createRoot( container );
		}

		root.render( React.createElement( component, otherProps, children ) );
	} );
	onDestroy( () => {
		if ( root ) {
			root.unmount();
		}
	} );
</script>

<div bind:this={container} class:inline />

<style>
	.inline {
		display: inline;
		display: contents;
	}
</style>
