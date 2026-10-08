<script lang="ts">
	/* eslint-disable import/no-duplicates -- https://github.com/import-js/eslint-plugin-import/issues/2992 */
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';
	/* eslint-enable import/no-duplicates */
	import { guideState } from '../stores/GuideState';
	import Bubble from './Bubble.svelte';
	import Popup from './Popup.svelte';
	import type { MeasurableImageStore } from '../stores/MeasurableImageStore';
	import type { GuideSize } from '../types';

	export let stores: MeasurableImageStore[];
	let show: number | false = false;

	/**
	 * This onMount is triggered when the window loads
	 * and the Image Guide UI is first
	 */
	onMount( () => {
		stores.forEach( store => store.updateDimensions() );
	} );

	function closeDetails( e ) {
		// Don't exit when hovering the Portal
		if (
			e.relatedTarget &&
			// Don't exit when hovering the Popup
			e.relatedTarget.classList.contains( 'keep-guide-open' )
		) {
			return;
		}

		show = false;
	}

	function getGuideSize( width = -1, height = -1 ): GuideSize {
		if ( width < 200 || height < 200 ) {
			return 'micro';
		} else if ( width < 400 || height < 400 ) {
			return 'small';
		}
		return 'normal';
	}

	function toggleBackdrop( on = false ) {
		if ( on ) {
			stores.forEach( store => store.node.classList.add( 'jetpack-boost-guide__backdrop' ) );
		} else {
			stores.forEach( store => store.node.classList.remove( 'jetpack-boost-guide__backdrop' ) );
		}
	}

	// Use the first image available in the stores to determine the guide size
	const sizeOnPage = stores[ 0 ].sizeOnPage;
	$: size = getGuideSize( $sizeOnPage.width, $sizeOnPage.height );

	$: toggleBackdrop( show !== false );
	let position = {
		top: 0,
		left: 0,
	};

	function hover( e: CustomEvent ) {
		const detail = e.detail;
		const index = detail.index;
		position = detail.position;
		show = index;
	}

	/**
	 * Only show image guide if at least one of the images
	 * has a file size available.
	 */
	const hasItemsWithFileSize = derived(
		stores.map( s => s.fileSize ),
		$fileSizes => $fileSizes.some( fileSize => fileSize.width !== -1 && fileSize.height !== -1 )
	);
</script>

{#if $guideState === 'active' && $hasItemsWithFileSize}
	<!-- Clear up complaints about needing an ARIA role: -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- eslint-disable-next-line svelte/valid-compile -->
	<div
		class="jb-ig-main guide {size}"
		class:show={show !== false}
		class:keep-guide-open={show !== false}
		on:mouseleave={closeDetails}
	>
		<div class="jb-ig-main previews">
			<!-- eslint-disable-next-line svelte/require-each-key -- What's a good key here? -->
			{#each stores as store, index}
				<Bubble {index} {store} on:hover={hover} />
			{/each}
		</div>
		{#if show !== false}
			<!--
				Intentionally using only a single component here.
				See <Popup> component source for details.
			 -->
			<Popup store={stores[ show ]} {size} {position} on:mouseleave={closeDetails} />
		{/if}
	</div>
{/if}
