<script lang="ts">
	import Bubble from './Bubble.svelte';
	import ImageGuide from './ImageGuide.svelte';
	import { state } from './StateStore';
	import type { GuideSize } from '../types';
	import type { MeasurableImageStore } from '../MeasurableImageStore';
	import { onMount } from 'svelte';

	export let stores: MeasurableImageStore[];
	let show: number | false;

	function onMouseLeave() {
		if ( $state !== 'always_on' ) {
			show = false;
		}
	}
	$: show = $state === 'always_on' ? 0 : false;

	let size: GuideSize = 'normal';
	const image = stores[ 0 ];
	const onPage = image.sizeOnPage;

	// Looking at the first image in the set is fine, at least for now.
	$: if ( $onPage.width < 200 || $onPage.height < 200 ) {
		size = 'micro';
	} else if ( $onPage.width < 400 || $onPage.height < 400 ) {
		size = 'small';
	}

	$: if ( show !== false ) {
		stores.forEach( i => i.node.classList.add( 'jetpack-boost-image-guide-backdrop' ) );
	} else {
		stores.forEach( i => i.node.classList.remove( 'jetpack-boost-image-guide-backdrop' ) );
	}

	onMount( () => {
		stores.forEach( store => store.updateWeight() );
	} );
</script>

{#if $state === 'active' || $state === 'always_on'}
	<div class="guide {size}" class:show={show !== false} on:mouseleave={onMouseLeave}>
		<div class="previews">
			{#each stores as store, index}
				<Bubble {index} {store} on:mouseenter={() => ( show = index )} />
			{/each}
		</div>
		{#each stores as store, index}
			{#if show === index}
				<ImageGuide {store} {size} />
			{/if}
		{/each}
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
