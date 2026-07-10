/**
 * Helpers for picking the best image URL to display in the carousel, based on
 * the viewport size and the image data exposed on the gallery markup.
 *
 * Extracted from jetpack-carousel.js so the URL-selection logic can be unit tested.
 */

/**
 * Strip non-cosmetic Photon arguments (resize, fit, etc.) from a Photon URL,
 * keeping only the whitelisted, cosmetic ones.
 *
 * @param {string} url - The Photon URL to sanitize.
 * @return {URL|string} The sanitized URL object, or the original string if it can't be parsed.
 */
export function sanitizePhotonUrl( url ) {
	var urlObj;
	try {
		urlObj = new URL( url );
		// eslint-disable-next-line no-unused-vars
	} catch ( e ) {
		return url;
	}

	var whitelistedPhotonArgs = [
		'quality',
		'ssl',
		'filter',
		'brightness',
		'contrast',
		'colorize',
		'smooth',
	];

	// Get all search params
	var searchParams = Array.from( urlObj.searchParams.entries() );

	// Clear all existing params
	urlObj.search = '';

	// Only add back whitelisted params
	searchParams.forEach( ( [ key, value ] ) => {
		if ( whitelistedPhotonArgs.includes( key ) ) {
			urlObj.searchParams.append( key, value );
		}
	} );

	return urlObj;
}

/**
 * Extract the width and height encoded in an image URL.
 *
 * @param {string}  file        - The image URL.
 * @param {number}  origWidth   - The original image width, used as a fallback.
 * @param {boolean} isPhotonUrl - Whether the URL is a Photon URL.
 * @return {Array} A [ width, height ] pair.
 */
export function getImageSizeParts( file, origWidth, isPhotonUrl ) {
	var size = isPhotonUrl
		? file.replace( /.*=([\d]+%2C[\d]+).*$/, '$1' )
		: file.replace( /.*-([\d]+x[\d]+)\..+$/, '$1' );

	var sizeParts;
	if ( size !== file ) {
		sizeParts = isPhotonUrl ? size.split( '%2C' ) : size.split( 'x' );
	} else {
		sizeParts = [ origWidth, 0 ];
	}

	// If one of the dimensions is set to 9999, then the actual value of that dimension can't be retrieved from the url.
	// In that case, we set the value to 0.
	if ( sizeParts[ 0 ] === '9999' ) {
		sizeParts[ 0 ] = '0';
	}

	if ( sizeParts[ 1 ] === '9999' ) {
		sizeParts[ 1 ] = '0';
	}

	return sizeParts;
}

/**
 * Pick the best image URL to display in the carousel for a given viewport size.
 *
 * @param {object} args - Image data (origFile, origWidth, origHeight, maxWidth, maxHeight, largeFile).
 * @return {string} The URL of the image to display.
 */
export function selectBestImageUrl( args ) {
	if ( typeof args !== 'object' ) {
		args = {};
	}

	if ( typeof args.origFile === 'undefined' ) {
		return '';
	}

	if ( typeof args.origWidth === 'undefined' || typeof args.maxWidth === 'undefined' ) {
		return args.origFile;
	}

	// When there's no large file to fall back on (e.g. images that weren't enriched with
	// Jetpack's data-large-file attribute), use the original file. A missing attribute is
	// read as an empty string, so we can't only guard against `undefined` here: otherwise a
	// narrow (portrait, mobile) viewport would return that empty string as the image source,
	// leaving the carousel with a blank slide.
	if ( ! args.largeFile ) {
		return args.origFile;
	}

	// Check if the image is being served by Photon (using a regular expression on the hostname).

	var imageLinkParser = document.createElement( 'a' );
	imageLinkParser.href = args.largeFile;

	var isPhotonUrl = /^i[0-2]\.wp\.com$/i.test( imageLinkParser.hostname );

	var largeSizeParts = getImageSizeParts( args.largeFile, args.origWidth, isPhotonUrl );

	var largeWidth = parseInt( largeSizeParts[ 0 ], 10 );
	var largeHeight = parseInt( largeSizeParts[ 1 ], 10 );

	args.origMaxWidth = args.maxWidth;
	args.origMaxHeight = args.maxHeight;

	// Give devices with a higher devicePixelRatio higher-res images (Retina display = 2, Android phones = 1.5, etc)
	if ( typeof window.devicePixelRatio !== 'undefined' && window.devicePixelRatio > 1 ) {
		args.maxWidth = args.maxWidth * window.devicePixelRatio;
		args.maxHeight = args.maxHeight * window.devicePixelRatio;
	}

	if ( largeWidth >= args.maxWidth || largeHeight >= args.maxHeight ) {
		return args.largeFile;
	}

	if ( isPhotonUrl ) {
		// args.origFile doesn't point to a Photon url, so in this case we use args.largeFile
		// to return the photon url of the original image.
		if ( args.largeFile.lastIndexOf( '?' ) === -1 ) {
			return args.largeFile;
		}

		// Sanitize the URL to remove non-cosmetic changes like resize, fit, etc.
		var sanitizedUrl = sanitizePhotonUrl( args.largeFile );

		// If we have a really large image load a smaller version
		// that is closer to the viewable size
		if ( args.origWidth > args.maxWidth || args.origHeight > args.maxHeight ) {
			// @2x the max sizes so we get a high enough resolution for zooming.
			args.origMaxWidth = args.maxWidth * 2;
			args.origMaxHeight = args.maxHeight * 2;
			// Add the fit arg to the list of Photon args.
			sanitizedUrl.searchParams.set( 'fit', args.origMaxWidth + ',' + args.origMaxHeight );
		}

		// Return a Photon URL image that's better fitted for the viewport.
		return sanitizedUrl.toString();
	}

	return args.origFile;
}
