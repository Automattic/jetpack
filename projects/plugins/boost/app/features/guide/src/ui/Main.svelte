<script lang="ts">
	import state from './StateStore';
	import type { ComparedImage } from '../Measurements';
	import ImageGuide from './ImageGuide.svelte';
	import Bubble from './Bubble.svelte';
	export let images: ComparedImage[];
	let show: number | false = false;
</script>

{#if $state === 'Active'}
	<div class="guide" class:show={show !== false} on:mouseleave={() => (show = false)}>
		<div class="previews">
			{#each images as image, index}
				<Bubble {index} ratio={image.scaling.pixels} on:mouseenter={() => (show = index)} />
			{/each}
		</div>
		{#if show !== false}
			<ImageGuide image={images[show]} />
		{/if}
	</div>
{/if}

<style lang="scss">
	.guide {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		z-index: 9000;
		padding: 15px;
		background-color: transparent;
		will-change: background-color;
		transition: background-color 100ms ease-out;

		&.show {
			background-color: hsl(0 90% 5% / 0.55);
		}

		&.show::after {
			content: '';

			position: absolute;
			bottom: 20px;
			right: 20px;
			display: block;

			height: 40px;
			width: 100px;

			background: url(../boost.png) no-repeat;
			background-position: center;
			background-size: 70px;
			overflow: hidden;

			border-radius: 6px;
			background-color: white;
		}

		// Important statements to override theme styles
		font-size: 15px !important;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen-Sans',
			'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif !important;
	}

	.previews {
		width: 100%;
		display: flex;
		gap: 15px;
		flex-wrap: wrap;
		margin-bottom: 15px;
	}
</style>
