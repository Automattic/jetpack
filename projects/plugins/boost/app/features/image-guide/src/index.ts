import { MeasurableImage } from './MeasurableImage';
import { attachGuides } from './attach-guides';
import { getMeasurableImages } from './find-image-elements';
import { guideState } from './stores/GuideState';
import AdminBarToggle from './ui/AdminBarToggle.svelte';
import type { MeasurableImageStore } from './stores/MeasurableImageStore';

function discardSmallImages( images: MeasurableImage[] ) {
	const minSize = 65;
	const elements = images.filter( image => {
		const { width, height } = image.getSizeOnPage();
		if ( ! width || ! height ) {
			return false;
		}
		return width >= minSize && height >= minSize;
	} );

	return elements;
}

/**
 * Initialize the admin bar toggle.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	const adminBarToggle = document.getElementById( 'wp-admin-bar-jetpack-boost-image-guide' );
	const link = adminBarToggle?.querySelector( 'a' );
	if ( adminBarToggle && link ) {
		const href = link.getAttribute( 'href' );
		link.remove();
		// eslint-disable-next-line no-new
		new AdminBarToggle( {
			target: adminBarToggle,
			props: {
				href,
			},
		} );
	}
} );

/**
 * Initialize the guides when window is loaded.
 */
const stores: MeasurableImageStore[] = [];

function debouncedStoreUpdate() {
	let debounce: number;
	return () => {
		if ( debounce ) {
			clearTimeout( debounce );
		}
		debounce = setTimeout( () => {
			stores.forEach( store => {
				store.updateDimensions();
			} );
		}, 500 );
	};
}

function initialize() {
	guideState.subscribe( async $state => {
		if ( $state === 'paused' ) {
			return;
		}
		const measurableImages = getMeasurableImages(
			Array.from(
				document.querySelectorAll(
					'body *:not(.jetpack-boost-guide > *):not(.jetpack-boost-guide)'
				)
			)
		);
		const filteredImages = discardSmallImages( measurableImages );
		stores.push( ...attachGuides( filteredImages ) );
	} );
}

window.addEventListener( 'load', () => {
	initialize();
	window.addEventListener( 'resize', debouncedStoreUpdate() );
} );
