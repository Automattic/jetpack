<script lang="ts">
	/* eslint-disable import/no-unresolved */
	import ReactDOM from 'react-dom';
	import React from 'react';
	import { afterUpdate, onDestroy } from 'svelte';
	let container: HTMLDivElement;
	afterUpdate( () => {
		const { this: component, children, ...props } = $$props;
		ReactDOM.render( React.createElement( component, props, children ), container );
	} );
	onDestroy( () => {
		ReactDOM.unmountComponentAtNode( container );
	} );
</script>

<div bind:this={container} />
