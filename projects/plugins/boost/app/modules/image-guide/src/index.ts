import { setupImageGuideUI } from '@automattic/jetpack-image-guide';
import { isSameOrigin } from '../../../assets/src/js/lib/utils/is-same-origin';
import { prepareAdminAjaxRequest } from '../../../assets/src/js/lib/utils/make-admin-ajax-request';
import { recordBoostPixelEvent } from '$lib/utils/analytics';
import analytics from '@automattic/jetpack-analytics';

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

		const contentType = response.headers.get( 'content-type' );

		if ( contentType && contentType.indexOf( 'application/json' ) !== -1 ) {
			const json = await response.clone().json();
			if ( json && json.data[ 'content-length' ] ) {
				// If the JSON data contains the content length, create a new response object with the JSON headers and the original response body.
				const headers = new Headers();
				for ( const key in json.data ) {
					if ( Object.hasOwn( json.data, key ) ) {
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

	const tracksCallback = ( action: string, props: { [ key: string ]: number | string } ) => {
		recordBoostPixelEvent( action, props );
	};

	const adminBarToggle = document.getElementById( 'wp-admin-bar-jetpack-boost-guide' );
	const link = adminBarToggle?.querySelector( 'a' );
	if ( adminBarToggle && link ) {
		const href = link.getAttribute( 'href' );
		link.remove();

		setupImageGuideUI( adminBarToggle, {
			href: href!,
			tracksCallback,
			fetchFunction: fetchWeightUsingProxy,
		} );
	}
} );
