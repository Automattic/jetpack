<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Button from '../../../../elements/Button.svelte';
	import { recordBoostEventAndRedirect } from '../../../../utils/analytics';
	export let edit_url: string | null;
	export let instructions: string;
	export let device_type: string;
</script>

<div class="jb-row-hover">
	<p class="jb-row-hover__instruction">{instructions}</p>

	{#if edit_url}
		<div class="jb-row-hover__button-container">
			<Button
				small
				fill
				on:click={() =>
					recordBoostEventAndRedirect( edit_url, 'clicked_edit_page_on_isa_report', {
						device_type,
					} )}
			>
				{__( 'Edit Page', 'jetpack-boost' )}
			</Button>
		</div>
	{/if}
</div>
