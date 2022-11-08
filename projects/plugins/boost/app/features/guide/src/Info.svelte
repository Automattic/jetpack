<script lang="ts">
  import { onMount } from 'svelte';
	import ImageGuide from './ImageGuide.svelte';
	import type { ComparedImage } from './Measurements';
	export let images: ComparedImage[];
	const insertNodes = images.some( image => image.type === "background" );

	// const ratio = image.scaling.pixels.toFixed(2);
	// const severity = *image.scaling.pixels > 4 ? 'high' : image.scaling.pixels > 2 ? 'medium' : 'normal';
	const ratio = 2;
	const severity = 'medium';

	let show: number|false = false;
</script>

<div class="jb-guide" class:bg={!insertNodes} on:mouseleave={() => show = false}>
	<div class="jb-guide-previews">
		{#each images as _, index}
		<div class="jb-guide-preview {severity}" on:mouseenter={() => show = index}>
			<div class="jb-guide-preview__ratio">{ratio}</div>
		</div>
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
