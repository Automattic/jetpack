
/**
 * External dependencies
 */
import { get, pickBy, startsWith } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from "./get-jetpack-data";

/**
 * Return an object with the allowed mime types for the site,
 * filtered vy the given mime type argument.
 * It allows `video, `audio`, ...
 *
 * @param {string} mimeType - File mime type.
 * @returns {object} Filtered allowed mime types.
 */
export function getAllowedVideoTypesByType( mimeType ) {
	if ( ! mimeType ) {
		return [];
	}
	return pickBy( getAllowedMimeTypesBySite(), ( type ) => startsWith( type, `${ mimeType }/` ) );
}

/**
 * Return the allowed file mime types for the site.
 *
 * @returns {object} Allowed Mime Types.
 */
export default function getAllowedMimeTypesBySite() {
	return get( getJetpackData(), [ 'allowedMimeTypes' ], [] );
}

