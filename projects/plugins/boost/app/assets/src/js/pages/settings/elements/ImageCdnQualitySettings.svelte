<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Tooltip from '../../../elements/Tooltip.svelte';
	import { imageCdnQuality } from '../../../stores/image-cdn';
	import { premiumFeatures } from '../../../stores/premium-features';
	import ImageCdnQualityControl from './ImageCdnQualityControl.svelte';
</script>

{#if $premiumFeatures.includes( 'image-cdn-quality' )}
	<div class="jb-image-cdn-quality__section-title">
		{__( 'Image Quality', 'jetpack-boost' )}
		<Tooltip>
			<div slot="title">
				{__( 'Image Quality', 'jetpack-boost' )}
			</div>
			{__(
				'Select the quality for images served by the CDN. Choosing a lower quality will compress your images and load them faster. If you choose lossless, we will not compress your images.',
				'jetpack-boost'
			)}
		</Tooltip>

		<span class="jb-badge">{__( 'Upgraded', 'jetpack-boost' )}</span>
	</div>
	<ImageCdnQualityControl
		label={__( 'JPEG Quality', 'jetpack-boost' )}
		bind:config={$imageCdnQuality.jpg}
		maxValue={89}
	/>
	<ImageCdnQualityControl
		label={__( 'PNG Quality', 'jetpack-boost' )}
		bind:config={$imageCdnQuality.png}
		maxValue={80}
	/>
	<ImageCdnQualityControl
		label={__( 'WEBP Quality', 'jetpack-boost' )}
		bind:config={$imageCdnQuality.webp}
		maxValue={80}
	/>
{/if}

<style lang="scss">
	.jb-image-cdn-quality__section-title {
		font-weight: bold;
	}
</style>
