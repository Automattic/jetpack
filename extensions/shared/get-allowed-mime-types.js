
/**
 * External dependencies
 */
import { get, pickBy, startsWith, flatten, map, keys } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

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
		return {};
	}
	return pickBy( getAllowedMimeTypesBySite(), ( type ) => startsWith( type, `${ mimeType }/` ) );
}

/**
 * Given the mime types object, return an Array with the all file extensions.
 * The keys of the Mime types object provided by the server
 * can define more than one file extension per key.
 * For instance: { 3g2|3gp2: "video/3gpp2" }. This function
 * pick up both extensions `3g2` and `3gp2` and populate the returned array.
 *
 * @param {object} mimeTypesObject - Object mime types.
 * @returns {Array} File extensions.
 */
export function pickFileExtensionsFromMimeTypes( mimeTypesObject ) {
	if ( ! mimeTypesObject ) {
		return [];
	}
	return flatten( map( keys( mimeTypesObject ), ( ext ) => ext.split( '|' ) ) );
}

/**
 * Return the allowed file mime types for the site.
 *
 * @returns {object} Allowed Mime Types.
 */
export default function getAllowedMimeTypesBySite() {
	return get( getJetpackData(), [ 'allowedMimeTypes' ], [] );
}

