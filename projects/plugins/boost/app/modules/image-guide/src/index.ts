import analytics from '@automattic/jetpack-analytics';
import { getMeasurableImages } from '@automattic/jetpack-image-guide';
import { isSameOrigin } from '../../../assets/src/js/utils/is-same-origin';
import { prepareAdminAjaxRequest } from '../../../assets/src/js/utils/make-admin-ajax-request';
import ImageGuideAnalytics from './analytics';
import { attachGuides } from './initialize';
import { guideState } from './stores/GuideState';
import AdminBarToggle from './ui/AdminBarToggle.svelte';
import type { MeasurableImageStore } from './stores/MeasurableImageStore';

/**
 * Fetches the weight of a resource using a proxy if the resource is not on the same origin.
 * This function is passed to MeasurableImageStore to be used when fetching the file size of images.
 *
 * @param url The URL of the resource to fetch.
 * @return A Promise that resolves to a Response object.
 */
async function fetchWeightUsingProxy( url: string ): Promise< Response > {
	if ( ! isSameOrigin( url ) ) {
		const response = await prepareAdminAjaxRequest(
			{
				action: 'boost_proxy_ig',
				proxy_url: url,
				nonce: jbImageGuide.proxyNonce,
			},
			jbImageGuide.ajax_url
		);

		if (
			response.headers.get( 'content-type' ) &&
			response.headers.get( 'content-type' ).indexOf( 'application/json' ) !== -1
		) {
			const json = await response.clone().json();
			if ( json && json.data[ 'content-length' ] ) {
				// If the JSON data contains the content length, create a new response object with the JSON headers and the original response body.
				const headers = new Headers();
				for ( const key in json.data ) {
					if ( json.data.hasOwnProperty( key ) ) {
						headers.set( key, json.data[ key ] );
					}
				}

				const newResponse = new Response( response.body, {
					status: response.status,
					statusText: response.statusText,
					headers,
				} );
				return newResponse;
			}
		}
	}

	// If the resource is on the same origin or the response is not JSON, fetch the resource using a HEAD request with no-cors mode.
	return await fetch( url, { method: 'HEAD', mode: 'no-cors' } );
}

/**
 * Initialize the AdminBarToggle component when the DOM is ready.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	analytics.initialize(
		jetpackBoostAnalytics.tracksData.userData.userid,
		jetpackBoostAnalytics.tracksData.userData.username,
		{
			blog_id: jetpackBoostAnalytics.tracksData.blogId,
		}
	);

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
		const measurableImages = await getMeasurableImages(
			Array.from(
				document.querySelectorAll(
					'body *:not(.jetpack-boost-guide > *):not(.jetpack-boost-guide)'
				)
			),
			fetchWeightUsingProxy
		);

		// wait for isImageTiny() to return true/false for each image.
		const tinyImages = await Promise.all( measurableImages.map( image => image.isImageTiny() ) );
		stores.push(
			...attachGuides( measurableImages.filter( ( _, index ) => ! tinyImages[ index ] ) )
		);

		ImageGuideAnalytics.trackPage( stores );
	} );
}

// Only show the image guide when not in the customizer (or any other iframe).
if ( ! window.frameElement ) {
	/**
	 * Initialize the guides after window has loaded,
	 * we don't need the guides sooner because
	 * images have likely not loaded yet.
	 */
	window.addEventListener( 'load', () => {
		initialize();
		window.addEventListener( 'resize', debounceDimensionUpdates() );
	} );
}
