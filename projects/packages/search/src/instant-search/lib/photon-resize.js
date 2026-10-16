import photon from 'photon';

// Photon only supports GIF, JPG, PNG, WebP, and HEIC images.
// @see https://developer.wordpress.com/docs/photon/
const SUPPORTED_IMAGE_TYPES = [ 'gif', 'jpg', 'jpeg', 'png', 'webp', 'heic' ];

/**
 * Ensures URLs have the correct protocol by checking if they match the current site domain.
 *
 * @param {string} url - Image URL
 * @return {string} - Image URL with correct protocol
 */
function ensureCorrectProtocol( url ) {
	if ( ! url ) {
		return '';
	}
	if ( url.match( /^https?:\/\// ) ) {
		return url;
	}
	if ( url.startsWith( '//' ) ) {
		return `${ window.location.protocol }${ url }`;
	}
	try {
		const urlToParse = url.includes( '://' ) ? url : `http://${ url }`;
		const parsedUrl = new URL( urlToParse );
		if ( parsedUrl.hostname === window.location.hostname ) {
			return `${ window.location.protocol }//${ url }`;
		}
	} catch {
		return url;
	}
	return url;
}

/**
 * Prepares a URL for Photon: ensures correct protocol and strips query strings.
 *
 * @param {string} url - Image URL
 * @return {string} - Prepared URL
 */
function prepareUrl( url ) {
	if ( ! url ) {
		return '';
	}
	return ensureCorrectProtocol( url ).split( '?', 1 )[ 0 ];
}

/**
 * Returns a Photon-resized URL, or the original src when Photon is disabled
 * or the image type is unsupported.
 *
 * @param {string}  src             - Image URL
 * @param {number}  width           - Max width in pixels
 * @param {number}  height          - Max height in pixels
 * @param {boolean} isPhotonEnabled - Enable/disable Photon resizing
 * @return {string} Photon-resized URL, or the original src unchanged.
 */
export function photonResize( src, width, height, isPhotonEnabled = true ) {
	if ( ! src || ! isPhotonEnabled ) {
		return src;
	}
	const prepared = prepareUrl( src );
	const ext = prepared.substring( prepared.lastIndexOf( '.' ) + 1 ).toLowerCase();
	if ( ! SUPPORTED_IMAGE_TYPES.includes( ext ) ) {
		return src;
	}
	const resized = photon( prepared, { resize: `${ width },${ height }` } );
	return resized ?? src;
}
