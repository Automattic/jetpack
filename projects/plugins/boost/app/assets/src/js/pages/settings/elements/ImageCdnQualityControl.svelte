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
			min-width: 4rem;
		}

		&__lossless {
			flex-shrink: 0;
		}

		&__slider {
			width: 100%;
		}
		.disabled {
			opacity: 0.3;
			filter: grayscale( 1 );
			pointer-events: none;
		}
	}

	@media screen and ( max-width: 782px ) {
		.jb-image-cdn-quality-control {
			flex-direction: column;
			align-items: flex-start;
			gap: 0;
			margin-bottom: 30px;

			&__label {
				margin: 0;
				font-weight: 500;
			}
		}
	}
</style>
