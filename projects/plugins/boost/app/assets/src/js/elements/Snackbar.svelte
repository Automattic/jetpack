<script lang="ts">
	import { Snackbar } from '@wordpress/components';
	import ReactComponent from './ReactComponent.svelte';

	export let message: string;
	let isActive = true;
</script>

{#if isActive}
	<ReactComponent this={Snackbar} children={message} onDismiss={() => ( isActive = false )} />
{/if}
