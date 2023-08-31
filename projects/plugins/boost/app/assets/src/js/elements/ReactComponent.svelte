<script lang="ts">
	/* eslint-disable import/no-unresolved */
	import React from 'react';
	import { afterUpdate, onDestroy } from 'svelte';
	import * as WPElement from '@wordpress/element';
	let container: HTMLDivElement;
	let root;
	afterUpdate( () => {
		const { this: component, children, ...props } = $$props;
		root = WPElement.createRoot( container );
		root.render( React.createElement( component, props, children ) );
	} );
	onDestroy( () => {
		if ( root ) {
			root.unmount();
		}
	} );
</script>

<div bind:this={container} />
