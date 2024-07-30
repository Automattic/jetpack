import { __ } from '@wordpress/i18n';

export const NO_MEDIA_ERROR = 'NO_MEDIA_ERROR';
export const FILE_TYPE_ERROR = 'FILE_TYPE_ERROR';
export const FILE_SIZE_ERROR = 'FILE_SIZE_ERROR';
export const VIDEO_LENGTH_TOO_LONG_ERROR = 'VIDEO_LENGTH_TOO_LONG_ERROR';
export const VIDEO_LENGTH_TOO_SHORT_ERROR = 'VIDEO_LENGTH_TOO_SHORT_ERROR';
export const DIMENSION_ERROR = 'DIMENSION_ERROR';

/**
 * Returns the error labels.
 *
 * @returns {Record<string, string>} The error labels.
 */
export function getErrorLabels() {
	return {
		[ FILE_SIZE_ERROR ]: __( 'File too big', 'jetpack' ),
		[ VIDEO_LENGTH_TOO_LONG_ERROR ]: __( 'Video too long', 'jetpack' ),
		[ VIDEO_LENGTH_TOO_SHORT_ERROR ]: __( 'Video too short', 'jetpack' ),
		[ DIMENSION_ERROR ]: __( 'Invalid dimensions', 'jetpack' ),
	};
}

/**
 * Returns the error label for a given error type.
 *
 * @param {string} errorType - The error type.
 *
 * @returns {string} The error label.
 */
export function getErrorLabel( errorType: string ) {
	return getErrorLabels()[ errorType ] || __( 'Invalid media', 'jetpack' );
}
