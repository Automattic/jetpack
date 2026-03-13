import photon from 'photon';
import { useEffect, useState } from 'react';

/**
 * Ensures URLs have the correct protocol by checking if they match the current site domain.
 * If they do, applies the current window protocol (http/https).
 *
 * @param {string} url - Image URL
 * @return {string} - Image URL with correct protocol if it matches current domain
 */
function ensureCorrectProtocol( url ) {
	if ( ! url ) {
		return '';
	}

	// If URL already has a protocol, return as-is
	if ( url.match( /^https?:\/\// ) ) {
		return url;
	}

	// Handle protocol-relative URLs (starting with //)
	if ( url.startsWith( '//' ) ) {
		// Protocol-relative URLs should always use the current page's protocol
		// This matches browser behavior where //example.com becomes https://example.com on HTTPS pages
		return `${ window.location.protocol }${ url }`;
	}

	try {
		// Create a URL object to properly parse the URL
		// If the URL doesn't have a protocol, we'll need to add one temporarily for parsing
		const urlToParse = url.includes( '://' ) ? url : `http://${ url }`;
		const parsedUrl = new URL( urlToParse );

		// Check if this matches the current site's domain
		if ( parsedUrl.hostname === window.location.hostname ) {
			return `${ window.location.protocol }//${ url }`;
		}
	} catch {
		// If URL parsing fails, return the original URL unchanged.
		return url;
	}

	return url;
}

/**
 * Prepares URLs for Photon by ensuring correct protocol and stripping query strings.
 *
 * @param {string} url - Image URL
 * @return {string} - Image URL with correct protocol and without query strings.
 */
function prepareUrl( url ) {
	if ( ! url ) {
		return '';
	}
	const urlWithProtocol = ensureCorrectProtocol( url );
	return urlWithProtocol.split( '?', 1 )[ 0 ];
}

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
	const initialSrcPrepared = prepareUrl( initialSrc );

	// Photon only supports GIF, JPG, PNG and WebP images
	// Photon also has partial support for HEIC which currently always
	// reencodes as JPG regardless of advertised support from the browser
	// @see https://developer.wordpress.com/docs/photon/
	const supportedImageTypes = [ 'gif', 'jpg', 'jpeg', 'png', 'webp', 'heic' ];
	const fileExtension = initialSrcPrepared
		?.substring( initialSrcPrepared.lastIndexOf( '.' ) + 1 )
		.toLowerCase();
	const isSupportedImageType = supportedImageTypes.includes( fileExtension );

	useEffect( () => {
		if ( isPhotonEnabled && isSupportedImageType ) {
			const photonSrc = photon( initialSrcPrepared, {
				resize: `${ width },${ height }`,
			} );
			setSrc( photonSrc ? photonSrc : initialSrc );
		} else {
			setSrc( initialSrc );
		}
	}, [ initialSrc, width, height, isPhotonEnabled, initialSrcPrepared, isSupportedImageType ] );

	return src;
}
