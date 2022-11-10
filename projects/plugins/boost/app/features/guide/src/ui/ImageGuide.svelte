<script lang="ts">
	import type { ComparedImage } from '../Measurements';
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	export let image: ComparedImage;
	const imageName = image.url.split('/').pop();
	const ratio = image.scaling.pixels.toFixed(2);
	const fakeSavingsInKB = Math.round(1024 / image.scaling.pixels).toFixed(2);

	const previewWidth = 100;
	const previewHeight = Math.floor(previewWidth / (image.width / image.height));
</script>

<div class="details" transition:fly={{ duration: 150, y: 4, easing: backOut }}>
	<div class="preview">
		<div class="description">
			<b>{ratio}x larger</b><br />
			The image loaded over the network is {ratio}x larger than it appears in the browser.
			<br>
		</div>
		<img
			src={image.url}
			alt={imageName}
			style="width: {previewWidth}px; height: {previewHeight}px;"
			width={previewWidth}
			height={previewHeight}
		/>
	</div>

	<div class="meta">
		<div class="row">
			<div class="label">Size in browser</div>
			<div class="value">{image.onScreen.width} x {image.onScreen.height}</div>
		</div>
		<div class="row">
			<div class="label">Size loaded</div>
			<div class="value">{image.width} x {image.height}</div>
		</div>
		<div class="row">
			<div class="label">Potential savings</div>
			<div class="value"><strong>{fakeSavingsInKB} KB</strong></div>
		</div>
	</div>
</div>

<style lang="scss">
	:global(.jetpack-boost-guide.relative) {
		position: relative;
	}

	.preview {
		display: flex;
		gap: 15px;
		margin-bottom: 15px;
		align-items: flex-start;
		max-width: 340px;
		width: 100%;
	}

	.details {
		color: #3c434a;
		padding: 25px;
		font-family: sans-serif;
		background-color: rgb(255, 255, 255);
		background: linear-gradient(159.87deg,#f6f6f4 7.24%,#f7f4ea 64.73%,#ddedd5 116.53%);
		margin-bottom: 10px;

		width: fit-content;
		min-width: 320px;
		border-radius: 6px;
		font-size: 15px;
	}

	img {
		border-radius: 3px;
		box-shadow: 0 0 2px 1px hsl(0deg 0% 95%)
	}

	.row {
		display: flex;
		gap: 10px;
		justify-content: space-between;
		margin-bottom: 5px;
		border-bottom: 1px dotted hsl(0deg 0% 85%);
		font-size: 14px;
		&:last-child {
			border-bottom: none;
		}
	}
</style>
