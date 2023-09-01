<script lang="ts">
	import { __, sprintf } from '@wordpress/i18n';
	import Tooltip from '../../../elements/Tooltip.svelte';
	import { imageCdnQuality } from '../../../stores/image-cdn';
	import { premiumFeatures } from '../../../stores/premium-features';
	import CollapsibleMeta from './CollapsibleMeta.svelte';
	import ImageCdnQualityControl from './ImageCdnQualityControl.svelte';
</script>

{#if $premiumFeatures.includes( 'image-cdn-quality' )}
	<CollapsibleMeta
		editText={__( 'Change Image Quality', 'jetpack-boost' )}
		closeEditText={__( 'Close', 'jetpack-boost' )}
	>
		<div slot="header" class="jb-image-cdn-quality__section-title">
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

		<div slot="summary">
			{sprintf(
				/* translators: %1$s is the JPEG quality value, %2$s is PNG quality value, and %3$s is WEBP quality value. Each value may also say 'lossless' */
				__( 'JPEG Quality: %1$s, PNG Quality: %2$s, WEBP Quality: %3$s', 'jetpack-boost' ),
				$imageCdnQuality.jpg.lossless
					? __( 'lossless', 'jetpack-boost' )
					: $imageCdnQuality.jpg.quality.toString(),
				$imageCdnQuality.png.lossless
					? __( 'lossless', 'jetpack-boost' )
					: $imageCdnQuality.png.quality.toString(),
				$imageCdnQuality.webp.lossless
					? __( 'lossless', 'jetpack-boost' )
					: $imageCdnQuality.webp.quality.toString()
			)}
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
	</CollapsibleMeta>
{/if}

<style lang="scss">
	.jb-image-cdn-quality__section-title {
		font-weight: bold;
	}
</style>
