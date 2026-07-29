import { useEffect, useState } from 'react';
import { photonResize } from '../photon-resize';

/**
 * Hook for returning a Photonized image URL given width and height parameters.
 *
 * @param {string}  initialSrc      - Image URL
 * @param {number}  width           - width in pixels
 * @param {number}  height          - height in pixels
 * @param {boolean} isPhotonEnabled - Toggle photon on/off
 * @return {string} - Photonized image URL if service is available; initialSrc otherwise.
 */
export function usePhoton( initialSrc, width, height, isPhotonEnabled = true ) {
	const [ src, setSrc ] = useState( null );

	useEffect( () => {
		setSrc( photonResize( initialSrc, width, height, isPhotonEnabled ) );
	}, [ initialSrc, width, height, isPhotonEnabled ] );

	return src;
}
