<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import api from '../../../../api/api';
	import Button from '../../../../elements/Button.svelte';
	import config from '../../../../stores/config';
	import { recordBoostEvent, recordBoostEventAndRedirect } from '../../../../utils/analytics';
	import type { ImageDataType } from '../../store/zod-types';
	export let edit_url: string | null;
	export let instructions: string;
	export let device_type: string;
	export let details: ImageDataType;

	async function fixImageSize() {
		let post_id = '0';
		if ( details.page.edit_url ) {
			const url = new URL( details.page.edit_url );
			post_id = new URLSearchParams( url.search ).get( 'post' );
		} else {
			post_id = '0';
		}

		const data = {
			image_url: details.image.url,
			image_width: details.image.dimensions.expected.width.toString(),
			image_height: details.image.dimensions.expected.height.toString(),
			post_id,
			nonce: Jetpack_Boost.fixImageNonce,
		};
		return await api.post( '/image-size-analysis/fix', data );
	}

	function handleFixClick() {
		recordBoostEvent( 'isa_fix_image', {} );
		return fixImageSize();
	}
</script>

<div class="hover">
	<p>{instructions}</p>

	{#if edit_url}
		<div class="button-container">
			{#if $config.autoFix && device_type === 'desktop'}
				<Button width="auto" fill on:click={() => handleFixClick()}>
					{__( 'Fix', 'jetpack-boost' )}
				</Button>
			{:else}
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
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.hover {
		display: flex;
		align-items: center;
		gap: var( --gap );
	}
	p {
		flex-grow: 1;
	}
</style>
