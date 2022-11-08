<script lang="ts">
	import type { ComparedImage } from '../Measurements';
	import ImageGuide from './ImageGuide.svelte';
	import Bubble from './Bubble.svelte';
	export let images: ComparedImage[];
	const insertNodes = images.some(image => image.type === 'background');

	let show: number | false = false;
	show = 0;
</script>

<div class="guide" class:bg={!insertNodes} on:mouseleave={() => (show = false)}>
	<div class="previews">
		{#each images as image, index}
			<Bubble ratio={image.scaling.pixels} on:mouseenter={() => (show = index)} />
		{/each}
	</div>
	{#if show !== false}
		<div class="overlay">
			<ImageGuide image={images[show]} />
		</div>
	{/if}
</div>

<style lang="scss">
	.jb-guide {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
	.overlay,
	.previews {
		position: absolute;
		top: 0;
		left: 0;
		padding: 20px;
		z-index: 9001;
	}

	.overlay {
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		background-color: hsl(0 90% 5% / 0.55);

		&::after {
			content: '';

			position: absolute;
			z-index: 9001;
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
	}

	.previews {
		position: absolute;
		width: fit-content;
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
</style>
