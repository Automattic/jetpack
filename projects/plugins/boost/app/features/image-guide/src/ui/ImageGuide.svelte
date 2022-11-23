<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { GuideSize, MeasuredImage } from '../types';
	import JetpackLogo from './JetpackLogo.svelte';

	export let image: MeasuredImage;
	export let size: GuideSize;

	// Reactive variables because this component can be reused by Svelte.
	$: imageName = image.url.split( '/' ).pop();
	$: ratio = image.scaling.oversizedBy.toFixed( 2 );
	$: potentialSavings = Math.round(
		image.fileSize.weight - image.fileSize.weight / image.scaling.oversizedBy
	);

	const previewWidth = size === 'normal' ? 100 : 50;
	const previewHeight = Math.floor(
		previewWidth / ( image.fileSize.width / image.fileSize.height )
	);

	$: origin = new URL( window.location.href ).origin;
	$: imageOrigin = new URL( image.url ).origin;
</script>

<div class="details" transition:fly={{ duration: 150, y: 4, easing: backOut }}>
	<div class="logo">
		<JetpackLogo size={250} />
	</div>

	<div class="preview">
		<div class="description">
			<b>{ratio}x larger</b><br />
			The image loaded over the network is {ratio}x larger than it appears in the browser.
			<br />
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
		{#if image.fileSize.weight > 0}
			<div class="row">
				<div class="label">Image Size</div>
				<div class="value">{Math.round( image.fileSize.weight )}kb</div>
			</div>
		{/if}

		<div class="row">
			<div class="label">Image Dimensions</div>
			<div class="value">{image.fileSize.width} x {image.fileSize.height}</div>
		</div>

		<div class="row">
			<div class="label">Image Dimensions on screen</div>
			<div class="value">{image.onScreen.width} x {image.onScreen.height}</div>
		</div>

		{#if potentialSavings > 0}
			<div class="row">
				<div class="label">Potential savings</div>
				<div class="value"><strong>{potentialSavings} KB</strong></div>
			</div>
		{/if}
	</div>

	{#if imageOrigin !== origin}
		<div class="origin">
			<p>
				<strong>Image Source</strong>
				Unable to fetch image size because the image is hosted on a different domain.
			</p>
			<div class="row">
				<div class="label">Image hosted on</div>
				<div class="value">{imageOrigin}</div>
			</div>
			<div class="row">
				<div class="label">Current page served from</div>
				<div class="value">{origin}</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	:root {
		--shadow-color: 97deg 21% 44%;
		--shadow: 0px 0px 0px hsl( var( --shadow-color ) / 0.35 ),
			0px 0px 0.5px -0.3px hsl( var( --shadow-color ) / 0.34 ),
			0px 0px 2px -0.4px hsl( var( --shadow-color ) / 0.27 ),
			0px 0px 0px -1.9px hsl( var( --shadow-color ) / 0.27 ),
			0px 0px 0px -2.6px hsl( var( --shadow-color ) / 0.25 ),
			0px 0px 0px -3.2px hsl( var( --shadow-color ) / 0.19 ),
			0.1px 0px 0.1px -3.8px hsl( var( --shadow-color ) / 0.14 );
	}
	.origin {
		margin-top: 30px;
		max-width: 400px;
		background-color: hsl( 240deg 0% 100% / 55% );
		background: linear-gradient(
			70deg,
			#f6f6f4 7.24%,
			hsla( 46, 45%, 94%, 0.8 ) 64.73%,
			hsla( 100, 40%, 88%, 0.725 ) 116.53%
		);
		padding: 20px;
		border-radius: 7px;
		box-shadow: var( --shadow );
		strong {
			display: block;
		}
	}

	:global( .jetpack-boost-guide.relative ) {
		position: relative;
	}

	.preview {
		display: flex;
		gap: 15px;
		margin-bottom: 15px;
		align-items: flex-start;
		max-width: 340px;
		width: 100%;
		img {
			border-radius: 3px;
			box-shadow: 0 0 2px 1px hsl( 0deg 0% 95% );
		}
	}

	.details {
		color: #3c434a;
		padding: 25px;
		font-family: sans-serif;
		background-color: rgb( 255, 255, 255 );
		background: linear-gradient( 159.87deg, #f6f6f4 7.24%, #f7f4ea 64.73%, #ddedd5 116.53% );
		margin-bottom: 10px;

		width: fit-content;
		min-width: 320px;
		border-radius: 6px;

		position: relative;
		overflow: hidden;

		text-align: left;
	}

	.description {
		font-size: 0.9em;
	}

	.row {
		display: flex;
		gap: 10px;
		justify-content: space-between;
		margin-bottom: 5px;
		border-bottom: 1px dotted hsl( 0deg 0% 85% );
		font-size: 14px;
		&:last-child {
			border-bottom: none;
		}
	}

	.logo {
		position: absolute;
		bottom: -25px;
		right: -50px;
		opacity: 0.04;
		transform: rotate( 15deg );
		pointer-events: none;
	}

	:global( .guide.small ) {
		.preview {
			gap: 8px;
		}

		.details {
			max-width: 300px;
			min-width: 200px;
			padding: 15px;
		}
	}
</style>
