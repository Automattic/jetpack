<script lang="ts">
	/* eslint-disable import/no-unresolved */
	import React from 'react';
	import { afterUpdate, onDestroy } from 'svelte';
	import * as WPElement from '@wordpress/element';
	let container: HTMLDivElement;
	let root;
	afterUpdate( () => {
		const { this: component, children, ...props } = $$props;
		// @todo: Remove fallback when we drop support for WP 6.1
		if ( WPElement.createRoot ) {
			root = WPElement.createRoot( container );
		} else {
			const theContainer = container;
			root = {
				render: theComponent => WPElement.render( theComponent, theContainer ),
				unmount: () => WPElement.unmountComponentAtNode( theContainer ),
			};
		}
		root.render( React.createElement( component, props, children ) );
	} );
	onDestroy( () => {
		if ( root ) {
			root.unmount();
		}
	} );
</script>

<div bind:this={container} />
