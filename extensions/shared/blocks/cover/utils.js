
/**
 * External dependencies
 */
import { pickBy, flatten, map, keys, values } from 'lodash';

/**
 * Internal dependencies
 */
import { isSimpleSite } from "../../site-type-utils";
import getJetpackExtensionAvailability from "../../get-jetpack-extension-availability";

/**
 * Check if the given file is a video.
 *
 * @param   {string|object} file - file to check.
 * @returns {boolean}       True if it's a video file. Otherwise, False.
 */
export function isVideoFile( file ) {
	// Pick up allowed mime types from the window object.
	const allowedMimeTypes = window?.Jetpack_Editor_Initial_State?.allowedMimeTypes;
	if ( ! allowedMimeTypes ) {
		return false;
	}

	if ( ! file ) {
		return false;
	}

	let allowedVideoMimeTypes = pickBy( allowedMimeTypes, ( type ) => /^video\//.test( type ) );
	const allowedVideoFileExtensions = flatten( map( keys( allowedVideoMimeTypes ), ext => ext.split( '|' ) ) );

	if ( typeof file === 'string' ) {
		const fileExtension = ( file.split( '.' ) )?.[ 1 ];
		return fileExtension && allowedVideoFileExtensions.includes( fileExtension );
	}

	allowedVideoMimeTypes = values( allowedVideoMimeTypes );

	if ( typeof file === 'object' ) {
		return file.type && allowedVideoMimeTypes.includes( file.type );
	}

	return false;
}

/**
 * Check if the cover block should show the upgrade nudge.
 *
 * @param {string} name - Block name.
 * @returns {boolean} True if it should show the nudge. Otherwise, False.
 */
export function isUpgradable( name ) {
	const { unavailableReason } = getJetpackExtensionAvailability( 'videopress' );

	return name && name === 'core/cover' && // upgrade only for cover block
		isSimpleSite() && // only for Simple sites
		[ 'missing_plan', 'unknown' ].includes( unavailableReason );
}
