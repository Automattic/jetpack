<script lang="ts">
	/* eslint-disable import/no-unresolved */
	import React from 'react';
	import ReactDOM from 'react-dom/client';
	import { afterUpdate, onDestroy } from 'svelte';
	let container: HTMLDivElement;
	let root;
	afterUpdate( () => {
		const { this: component, children, ...props } = $$props;
		root = ReactDOM.createRoot( container );
		root.render( React.createElement( component, props, children ) );
	} );
	onDestroy( () => {
		if ( root ) {
			root.unmount();
		}
	} );
</script>

<div bind:this={container} />
