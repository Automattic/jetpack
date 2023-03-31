<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	let portal: HTMLElement;

	onMount( () => {
		document.body.appendChild( portal );
	} );
	onDestroy( () => {
		document.body.removeChild( portal );
	} );
</script>

<div class="jetpack-boost-guide-portal" bind:this={portal}>
	<slot />
</div>
