<script lang="ts">
	import ImageGuide from './ImageGuide.svelte';
	import type { ComparedImage } from './Measurements';
	import Bubble from './Bubble.svelte';
	export let images: ComparedImage[];
	const insertNodes = images.some(image => image.type === 'background');

	let show: number | false = false;
</script>


<div class="jb-guide" class:bg={!insertNodes} on:mouseleave={() => (show = false)}>
	<div class="jb-guide-previews">
		{#each images as image, index}
			<Bubble ratio={image.scaling.pixels} on:mouseenter={() => (show = index)} />
		{/each}
	</div>
	{#if show !== false}
		<ImageGuide image={images[show]} />
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
</style>
