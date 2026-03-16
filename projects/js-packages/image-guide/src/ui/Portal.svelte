<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	let portal: HTMLElement;
	let originalParent: Node | null = null;
	let originalNextSibling: Node | null = null;

	onMount( () => {
		originalParent = portal.parentNode;
		originalNextSibling = portal.nextSibling;
		document.body.appendChild( portal );
	} );
	onDestroy( () => {
		// Move the element back to its original position so Svelte's
		// internal DOM cleanup can find and remove it properly.
		if ( originalParent ) {
			originalParent.insertBefore( portal, originalNextSibling );
		}
	} );
</script>

<div class="jetpack-boost-guide-portal" bind:this={portal}>
	<slot />
</div>
