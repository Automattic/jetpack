<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import NumberSlider from '../../../elements/NumberSlider.svelte';

	export let label: string;

	export let config: {
		lossless?: boolean;
		quality?: number;
	};

	export let maxValue: number;
	export let minValue = 20;
</script>

<div class="jb-image-cdn-quality-control">
	<div class="jb-image-cdn-quality-control__label">
		{label}
	</div>
	<div class="jb-image-cdn-quality-control__slider" class:disabled={config.lossless}>
		<NumberSlider bind:currentValue={config.quality} {minValue} {maxValue} />
	</div>
	<label class="jb-image-cdn-quality-control__lossless">
		<input type="checkbox" bind:checked={config.lossless} />
		{__( 'Lossless', 'jetpack-boost' )}
	</label>
</div>

<style lang="scss">
	.jb-image-cdn-quality-control {
		display: flex;
		align-items: center;
		min-height: 40px;
		margin-top: 8px;
		gap: 20px;

		&__label {
			flex-basis: 4rem;
		}

		&__lossless {
			flex-shrink: 0;
		}

		&__slider {
			width: 100%;
		}
		.disabled {
			opacity: 0.5;
			filter: grayscale(1);
			pointer-events: none;
		}
	}
</style>
