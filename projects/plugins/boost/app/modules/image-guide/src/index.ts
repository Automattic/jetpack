import { getMeasurableImages } from '@automattic/jetpack-image-guide';
import ImageGuideAnalytics from './analytics';
import { attachGuides } from './initialize';
import { guideState } from './stores/GuideState';
import AdminBarToggle from './ui/AdminBarToggle.svelte';
import type { MeasurableImageStore } from './stores/MeasurableImageStore';
import type { MeasurableImage } from '@automattic/jetpack-image-guide';

/**
 * A helper function to filter out images
 * that are too small, for example
 * avatars, icons, etc.
 *
 * @param images An array of images to filter
 */
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
 * Initialize the AdminBarToggle component when the DOM is ready.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	const adminBarToggle = document.getElementById( 'wp-admin-bar-jetpack-boost-guide' );
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

/**
 * Guides need to recalculate dimensions and possibly weights.
 * This is done when the window is resized,
 * but because that event is fired multiple times,
 * it's better to debounce it.
 */
function debounceDimensionUpdates() {
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

/**
 * Initialize the guides when window is loaded.
 *
 * Subscribing to the Guide State ensures
 * that whenever the state is changed,
 * the DOM will be re-queried
 * to look for new images.
 */
function initialize() {
	ImageGuideAnalytics.trackInitialState();

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

		ImageGuideAnalytics.trackPage( stores );
	} );
}

/**
 * Initialize the guides after window has loaded,
 * we don't need the guides sooner because
 * images have likely not loaded yet.
 */
if ( ! window.frameElement ) {
	window.addEventListener( 'load', () => {
		initialize();
		window.addEventListener( 'resize', debounceDimensionUpdates() );
	} );
}
