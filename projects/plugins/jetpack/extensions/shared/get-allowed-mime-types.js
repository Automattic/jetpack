import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { get, pickBy, startsWith, flatten, map, keys, values } from 'lodash';

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
	return pickBy( getAllowedMimeTypesBySite(), type => startsWith( type, `${ mimeType }/` ) );
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
	return flatten( map( keys( mimeTypesObject ), ext => ext.split( '|' ) ) );
}

/**
 * Return the allowed file mime types for the site.
 *
 * @returns {object} Allowed Mime Types.
 */
export default function getAllowedMimeTypesBySite() {
	return get( getJetpackData(), [ 'allowedMimeTypes' ], [] );
}

/**
 * Check if the given file matches with the file type.
 *
 * @param   {string|object} file - File to check.
 * @param   {string}        type - File type used to check the file.
 * @returns {boolean}       True if file type matches with the given type. Otherwise, False.
 */
export function isFileOfType( file, type ) {
	if ( ! file || ! type ) {
		return false;
	}

	const allowedMimeTypes = getAllowedMimeTypesBySite();
	if ( ! allowedMimeTypes ) {
		return false;
	}

	const allowedVideoMimeTypes = getAllowedVideoTypesByType( type );
	const allowedVideoFileExtensions = pickFileExtensionsFromMimeTypes( allowedVideoMimeTypes );

	if ( typeof file === 'string' ) {
		const fileExtension = file.split( '.' ).pop();
		return fileExtension && allowedVideoFileExtensions.includes( fileExtension );
	}

	if ( typeof file === 'object' ) {
		return file.type && values( allowedVideoMimeTypes ).includes( file.type );
	}

	return false;
}
