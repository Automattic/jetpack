<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import api from '../../api/api';
	import Button from '../../elements/Button.svelte';
	import ErrorNotice from '../../elements/ErrorNotice.svelte';

	let errorMessage: undefined | string;
	let busy = false;

	async function onStartAnalysis() {
		try {
			errorMessage = undefined;
			busy = true;
			await api.post( '/image-size-analysis/start' );
		} catch ( err ) {
			errorMessage = err.message;
		} finally {
			busy = false;
		}
	}
</script>

<div class="button-area">
	<Button disabled={busy} on:click={onStartAnalysis}>Start image analysis</Button>
</div>

{#if errorMessage}
	<div class="error-area">
		<ErrorNotice title={__( 'Failed to request an Image Analysis job', 'jetpack-boost' )}>
			{errorMessage}
		</ErrorNotice>
	</div>
{/if}

<style>
	.error-area {
		margin-top: 16px;
	}
</style>
