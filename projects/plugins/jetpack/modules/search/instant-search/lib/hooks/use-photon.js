/**
 * External dependencies
 */
import photon from 'photon';
import { useEffect, useState } from 'preact/hooks';

/**
 * Strips query string values from URLs; photon can't handle them.
 *
 * @param {string} url - Image URL
 *
 * @returns {string} - Image URL without any query strings.
 */
function stripQueryString( url ) {
	return url.split( '?', 1 )[ 0 ];
}

/**
 * Hook for returning a Photonized image URL given width and height parameters.
 *
 * @param {string} initialSrc - Image URL
 * @param {number} width - width in pixels
 * @param {number} height - height in pixels
 * @param {boolean} isPhotonEnabled - Toggle photon on/off
 *
 * @returns {string} - Photonized image URL if service is available; initialSrc otherwise.
 */
export function usePhoton( initialSrc, width, height, isPhotonEnabled = true ) {
	const [ src, setSrc ] = useState( null );

	useEffect( () => {
		if ( isPhotonEnabled ) {
			const photonSrc = photon( stripQueryString( initialSrc ), {
				resize: `${ width },${ height }`,
			} );
			setSrc( photonSrc ? photonSrc : initialSrc );
		} else {
			setSrc( initialSrc );
		}
	}, [ initialSrc, width, height, isPhotonEnabled ] );

	return src;
}
