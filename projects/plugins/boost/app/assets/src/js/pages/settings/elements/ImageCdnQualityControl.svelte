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
	<div class="jb-image-cdn-quality-control__lossless">
		<input type="checkbox" bind:checked={config.lossless} />
		{__( 'Lossless', 'jetpack-boost' )}
	</div>
	{#if ! config.lossless}
		<div class="jb-image-cdn-quality-control__slider">
			<NumberSlider bind:currentValue={config.quality} {minValue} {maxValue} />
		</div>
	{/if}
</div>

<style lang="scss">
	.jb-image-cdn-quality-control {
		display: flex;
		align-items: center;
		min-height: 40px;
		margin-top: 8px;

		&__label {
			margin-right: 10px;
			flex-shrink: 0;
			width: 7em;
		}

		&__lossless {
			margin-right: 10px;
			flex-shrink: 0;
		}

		&__slider {
			width: 100%;
		}
	}
</style>
