<script lang="ts">
	import { useNavigate } from 'svelte-navigator';
	import { __, sprintf } from '@wordpress/i18n';
	import CollapsibleMeta from './CollapsibleMeta.svelte';
	import ImageCdnQualityControl from './ImageCdnQualityControl.svelte';
	import { imageCdnQuality } from './lib/stores/image-cdn-store';
	import TemplatedString from '$features/TemplatedString.svelte';
	import { Tooltip } from '$features/ui';
	import actionLinkTemplateVar from '$lib/utils/action-link-template-var';
	import ReactComponent from '$features/ReactComponent.svelte';

	const navigate = useNavigate();
	export let isPremium: boolean;
</script>

{#if isPremium}
	<CollapsibleMeta
		editText={__( 'Change Image Quality', 'jetpack-boost' )}
		closeEditText={__( 'Close', 'jetpack-boost' )}
	>
		<div slot="header" class="jb-image-cdn-quality__section-title">
			{__( 'Image Quality', 'jetpack-boost' )}
			<ReactComponent
				this={Tooltip}
				title={__( 'Image Quality', 'jetpack-boost' )}
				inline
				children={__(
					'Select the quality for images served by the CDN. Choosing a lower quality will compress your images and load them faster. If you choose lossless, we will not compress your images.',
					'jetpack-boost'
				)}
			></ReactComponent>

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
			label={__( 'JPEG', 'jetpack-boost' )}
			bind:config={$imageCdnQuality.jpg}
			maxValue={89}
		/>
		<ImageCdnQualityControl
			label={__( 'PNG', 'jetpack-boost' )}
			bind:config={$imageCdnQuality.png}
			maxValue={80}
		/>
		<ImageCdnQualityControl
			label={__( 'WEBP', 'jetpack-boost' )}
			bind:config={$imageCdnQuality.webp}
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
