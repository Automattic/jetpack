<script lang="ts">
	import { useNavigate } from 'svelte-navigator';
	import { __, sprintf } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import Tooltip from '../../../elements/Tooltip.svelte';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import CollapsibleMeta from './CollapsibleMeta.svelte';
	import ImageCdnQualityControl from './ImageCdnQualityControl.svelte';
	import type { ImageCdnQuality } from '../../../stores/image-cdn';

	const navigate = useNavigate();
	export let quality: ImageCdnQuality;
	export let isPremium: boolean;
</script>

{#if isPremium}
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
				quality.jpg.lossless ? __( 'lossless', 'jetpack-boost' ) : quality.jpg.quality.toString(),
				quality.png.lossless ? __( 'lossless', 'jetpack-boost' ) : quality.png.quality.toString(),
				quality.webp.lossless ? __( 'lossless', 'jetpack-boost' ) : quality.webp.quality.toString()
			)}
		</div>

		<ImageCdnQualityControl
			label={__( 'JPEG', 'jetpack-boost' )}
			bind:config={quality.jpg}
			maxValue={89}
		/>
		<ImageCdnQualityControl
			label={__( 'PNG', 'jetpack-boost' )}
			bind:config={quality.png}
			maxValue={80}
		/>
		<ImageCdnQualityControl
			label={__( 'WEBP', 'jetpack-boost' )}
			bind:config={quality.webp}
			maxValue={80}
		/>
	</CollapsibleMeta>
{:else}
	<TemplatedString
		template={__(
			`For more control over image quality, <link>upgrade now!</link>`,
			'jetpack-boost'
		)}
		vars={actionLinkTemplateVar( () => {
			navigate( 'upgrade' );
		}, 'link' )}
	/>
{/if}

<style lang="scss">
	.jb-image-cdn-quality {
		&__section-title {
			font-weight: bold;
		}
	}
</style>
