<script lang="ts">
	import Bubble from './Bubble.svelte';
	import Popup from './Popup.svelte';
	import { state } from './StateStore';
	import type { GuideSize } from '../types';
	import type { MeasurableImageStore } from '../MeasurableImageStore';
	import { onMount } from 'svelte';

	export let stores: MeasurableImageStore[];
	let show: number | false;

	/**
	 * This onMount is triggered when the window loads
	 * and the Image Guide UI is first
	 */
	onMount(() => {
		stores.forEach(store => store.updateDimensions());
	});

	function onMouseLeave() {
		if ($state !== 'always_on') {
			show = false;
		}
	}

	function getGuideSize(width = -1, height = -1): GuideSize {
		if (width < 200 || height < 200) {
			return 'micro';
		} else if (width < 400 || height < 400) {
			return 'small';
		}
		return 'normal';
	}

	function toggleBackdrop(on = false) {
		if (on) {
			stores.forEach(store => store.node.classList.add('jetpack-boost-guide__backdrop'));
		} else {
			stores.forEach(store => store.node.classList.remove('jetpack-boost-guide__backdrop'));
		}
	}

	// Use the first image available in the stores to determine the guide size
	const sizeOnPage = stores[0].sizeOnPage;
	$: size = getGuideSize($sizeOnPage.width, $sizeOnPage.height);

	$: show = $state === 'always_on' ? 0 : false;
	$: toggleBackdrop(show !== false);
</script>

{#if $state === 'active' || $state === 'always_on'}
	<div class="guide {size}" class:show={show !== false} on:mouseleave={onMouseLeave}>
		<div class="previews">
			{#each stores as store, index}
				<Bubble {index} {store} on:mouseenter={() => (show = index)} />
			{/each}
		</div>
		{#if show !== false}
			<!--
				Intentionally using only a single component here.
				See <Popup> component source for details.
			 -->
			<Popup store={stores[show]} {size} />
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

		// !important statements override theme styles
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

	:global(.jetpack-boost-guide__backdrop) {
		transition: opacity 0.2s ease-in-out, filter 0.2s ease-in-out;
		filter: brightness(0.3);
	}

</style>
