/**
 * External dependencies
 */
import { values } from 'lodash';

/**
 * Internal dependencies
 */
import { isSimpleSite } from '../../site-type-utils';
import getJetpackExtensionAvailability from '../../get-jetpack-extension-availability';
import getAllowedMimeTypesBySite, {
	getAllowedVideoTypesByType,
	pickFileExtensionsFromMimeTypes,
} from '../../get-allowed-mime-types';

/**
 * Check if the given file is a video.
 *
 * @param   {string|object} file - file to check.
 * @returns {boolean}       True if it's a video file. Otherwise, False.
 */
export function isVideoFile( file ) {
	if ( ! file ) {
		return false;
	}

	const allowedMimeTypes = getAllowedMimeTypesBySite();
	if ( ! allowedMimeTypes ) {
		return false;
	}

	const allowedVideoMimeTypes = getAllowedVideoTypesByType( 'video' );
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

/**
 * Check if the cover block should show the upgrade nudge.
 *
 * @param {string} name - Block name.
 * @returns {boolean} True if it should show the nudge. Otherwise, False.
 */
export function isUpgradable( name ) {
	const { unavailableReason } = getJetpackExtensionAvailability( 'videopress' );

	return (
		name &&
		name === 'core/cover' && // upgrade only for cover block
		isSimpleSite() && // only for Simple sites
		[ 'missing_plan', 'unknown' ].includes( unavailableReason )
	);
}
