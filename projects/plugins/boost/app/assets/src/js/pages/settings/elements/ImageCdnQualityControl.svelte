<script lang="ts" context="module">
	import { __ } from '@wordpress/i18n';
	import NumberSlider from '../../../elements/NumberSlider.svelte';
	import Tooltip from '../../../elements/Tooltip.svelte';
	import { imageCdnQuality } from '../../../stores/image-cdn';
</script>

<div class="jb-image-cdn-quality">
	<div class="jb-image-cdn-quality__label">
		{__( 'Image Quality', 'jetpack-boost' )}
		<Tooltip>
			<div slot="title">
				{__( 'Image Quality', 'jetpack-boost' )}
				<span class="jb-badge">Upgraed</span>
			</div>
			{__(
				'Select the quality for images served by the CDN. Choosing a lower quality will compress your images and load them faster.',
				'jetpack-boost'
			)}
		</Tooltip>
	</div>
	<div class="jb-image-cdn-quality__slider">
		<NumberSlider valueStore={imageCdnQuality} minValue={1} maxValue={100} />
	</div>
</div>

<style lang="scss">
	.jb-image-cdn-quality {
		display: flex;
		align-items: center;

		&__label {
			margin-right: 10px;
			flex-shrink: 0;
			font-weight: bold;
		}

		&__slider {
			width: 100%;
		}
	}
</style>
