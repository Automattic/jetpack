<script lang="ts">
	import { getRedirectUrl } from '@automattic/jetpack-components';
	import { onMount } from 'svelte';
	import { backOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import JetpackLogo from './JetpackLogo.svelte';
	import Portal from './Portal.svelte';
	import External from './assets/External.svelte';
	import type { MeasurableImageStore } from '../stores/MeasurableImageStore';
	import type { GuideSize } from '../types';

	export let store: MeasurableImageStore;
	export let size: GuideSize;
	export let position: {
		top: number;
		left: number;
	};

	function maybeDecimals( num: number ) {
		return num % 1 === 0 ? num : parseFloat( num.toFixed( 2 ) );
	}

	/**
	 * This is assigning a lot of reactive variables
	 * to avoid re-rendering the component
	 * when browsing between multiple bubbles next to each other.
	 *
	 * Note that in Main.svelte only the properties of this component
	 * change to avoid creating multiple components.
	 */
	$: isLoading = store.loading;
	$: oversizedRatio = store.oversizedRatio;
	$: fileSize = store.fileSize;
	$: sizeOnPage = store.sizeOnPage;
	$: potentialSavings = store.potentialSavings;
	$: expectedSize = store.expectedSize;
	$: imageURL = store.url;
	$: imageName = $imageURL.split( '/' ).pop();

	// Get the image origin
	$: origin = new URL( window.location.href ).origin;
	$: imageOrigin = new URL( $imageURL ).origin;

	$: previewWidth = size === 'normal' ? 100 : 50;
	$: previewHeight = Math.floor( previewWidth / ( $fileSize.width / $fileSize.height ) );
	$: ratio = maybeDecimals( $oversizedRatio );

	/**
	 * The pop-up is a fixed position element.
	 * This makes the pop-up behave as it would be positioned absolutely.
	 * Otherwise the pop-up could get cut off by the viewport, making a part of it inaccessible..
	 */
	let scrollY = 0;
	let initialScrollY = 0;
	let initialTop = 0;

	function repositionOnScroll( scrollPosY ) {
		if ( scrollPosY === 0 || initialScrollY === scrollPosY ) {
			return;
		}
		position.top = initialTop + ( initialScrollY - scrollPosY );
	}

	onMount( () => {
		initialScrollY = scrollY;
		initialTop = position.top;
	} );
	$: repositionOnScroll( scrollY );

	const DOCUMENTATION_URL = getRedirectUrl( 'jetpack-support-boost-image-performance-guide' );
</script>

<svelte:window bind:scrollY />
<Portal>
	<div
		class="jetpack-boost-guide-popup keep-guide-open"
		in:fly={{ duration: 150, y: 4, easing: backOut }}
		style:top="{position.top}px"
		style:left="{position.left}px"
		on:mouseleave
	>
		<div class="logo">
			<JetpackLogo size={250} />
		</div>

		<div class="preview">
			<div class="description">
				<div class="title">
					<a href={$imageURL} target="_blank noreferrer">{imageName}</a>
				</div>
				{#if ratio >= 1.3}
					<div class="explanation">
						The image loaded is <strong>{ratio}x</strong> larger than it appears in the browser.
						{#if $fileSize.weight > 450}
							Try using a smaller image or reduce the file size by compressing it.
						{/if}
					</div>
				{:else if ratio === 1}
					<div class="explanation">The image is exactly the correct size for this screen.</div>
				{:else if ratio >= 0.99 && ratio < 1.3}
					<div class="explanation">
						The image size is very close to the size it appears in the browser.
						{#if ratio > 1}
							Because there are various screen sizes, it's okay for the image to be
							<strong>{ratio}x</strong> than it appears on the page.
						{/if}
					</div>
				{:else}
					{@const  stretchedBy = maybeDecimals( 1 / $oversizedRatio ) }
					<div class="explanation">
						The image file is {stretchedBy}x smaller than expected on this screen. This might be
						fine, but you may want to check if the image appears blurry.
					</div>
				{/if}
			</div>
			{#if $imageURL}
				<img
					src={$imageURL}
					alt={imageName}
					style="width: {previewWidth}px; height: {previewHeight}px;"
					width={previewWidth}
					height={previewHeight}
				/>
			{/if}
		</div>

		<div class="meta">
			<div class="row">
				<div class="label">Image File Dimensions</div>
				{#if $fileSize.width > 0 && $fileSize.height > 0}
					<div class="value">{$fileSize.width} x {$fileSize.height}</div>
				{:else}
					<div class="value">
						{#if $isLoading}
							Loading...
						{:else}
							<em>Unknown</em>
						{/if}
					</div>
				{/if}
			</div>

			<div class="row">
				<div class="label">Expected Dimensions</div>
				<div class="value">{$expectedSize.width} x {$expectedSize.height}</div>
			</div>

			<div class="row">
				<div class="label">Size on screen</div>
				<div class="value">{$sizeOnPage.width} x {$sizeOnPage.height}</div>
			</div>

			<div class="row">
				<div class="label">Image Size</div>
				<div class="value">
					{#if $fileSize.weight > 0}
						{Math.round( $fileSize.weight )} KB
					{:else if $isLoading}
						Loading...
					{:else}
						<em>Unknown</em>
					{/if}
				</div>
			</div>

			<div class="row">
				<div class="label">Potential savings</div>
				<div class="value">
					{#if $potentialSavings > 0}
						<strong>{$potentialSavings} KB</strong>
					{:else if $isLoading}
						Loading...
					{:else}
						<em>N/A</em>
					{/if}
				</div>
			</div>
			{#if imageOrigin !== origin}
				<div class="info">
					Unable to estimate file size savings because the image is hosted on a different domain.
				</div>
			{/if}

			<div class="info">
				<a class="documentation" href={DOCUMENTATION_URL} target="_blank noreferrer"
					>Learn how to improve site speed by optimizing images <External /></a
				>
			</div>
		</div>
	</div>
</Portal>

<style lang="scss">
	a {
		color: #3c434a !important;
		font-weight: 600 !important;

		&.documentation {
			color: #3c434a !important;
			font-weight: 500 !important;
		}
	}

	.preview {
		display: flex;
		gap: 15px;
		margin-bottom: 15px;
		align-items: flex-start;
		max-width: 360px;
		width: 100%;
		img {
			border-radius: 3px;
			box-shadow: 0 0 2px 1px hsl( 0deg 0% 95% );
		}
	}

	.info {
		margin-top: 15px;
		font-size: 0.9em;
	}

	.jetpack-boost-guide-popup {
		color: #3c434a;
		padding: 25px;
		font-family: sans-serif;
		background-color: rgb( 255, 255, 255 );
		background: linear-gradient( 159.87deg, #f6f6f4 7.24%, #f7f4ea 64.73%, #ddedd5 116.53% );
		margin-bottom: 10px;

		width: fit-content;
		min-width: 320px;
		border-radius: 6px;

		overflow: hidden;

		position: fixed;
		z-index: 90000;

		text-align: left;
	}

	.title {
		font-weight: 600;
	}
	.explanation {
		margin-top: 5px;
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
	}
</style>
