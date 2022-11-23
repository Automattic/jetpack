<script lang="ts">
	import { measure } from '../Measurements';
	import Bubble from './Bubble.svelte';
	import ImageGuide from './ImageGuide.svelte';
	import { state } from './StateStore';
	import type { GuideSize, MeasuredImage } from '../types';

	export let images: MeasuredImage[];
	let show: MeasuredImage | false = false;

	function onMouseLeave() {
		if ( $state !== 'always_on' ) {
			show = false;
		}
	}
	$: show = $state === 'always_on' ? images[ 0 ] : false;

	let size: GuideSize = 'normal';
	const image = images[ 0 ];
	// Looking at the first image in the set is fine, at least for now.
	if ( image.onScreen.width < 200 || image.onScreen.height < 200 ) {
		size = 'micro';
	} else if ( image.onScreen.width < 400 || image.onScreen.height < 400 ) {
		size = 'small';
	}

	$: if ( show ) {
		images.forEach( i => i.node.classList.add( 'jetpack-boost-image-guide-backdrop' ) );
	} else {
		images.forEach( i => i.node.classList.remove( 'jetpack-boost-image-guide-backdrop' ) );
	}

	let debounce: number;
	function updateDimensions() {
		if ( debounce ) {
			clearTimeout( debounce );
		}
		debounce = setTimeout( () => {
			images = measure( images );
		}, 500 );
	}
</script>

<svelte:window on:resize={updateDimensions} />

{#if $state === 'active' || $state === 'always_on'}
	<div class="guide {size}" class:show={show !== false} on:mouseleave={onMouseLeave}>
		<div class="previews">
			{#each images as image, index}
				<Bubble
					{index}
					oversizedBy={image.scaling.oversizedBy}
					on:mouseenter={() => ( show = images[ index ] )}
				/>
			{/each}
		</div>
		{#if show !== false}
			<ImageGuide {size} image={show} />
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
		z-index: 8000;
		line-height: 1.55;
		padding: 15px;
		&.small {
			font-size: 13px;
			padding: 15px;
		}

		&.micro {
			font-size: 13px;
			padding: 10px;
		}

		&.show {
			z-index: 9000;
		}

		// Important statements to override theme styles
		font-size: 15px !important;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen-Sans',
			'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif !important;
	}

	:global( .jetpack-boost-image-guide-backdrop ) {
		transition: opacity 0.2s ease-in-out, filter 0.2s ease-in-out;
		filter: brightness( 0.3 );
	}

	.previews {
		width: 100%;
		display: flex;
		gap: 15px;
		flex-wrap: wrap;
		margin-bottom: 15px;
	}
</style>
