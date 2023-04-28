import { useCallback, useMemo } from 'react';
import { DEFAULT_RESTRICTIONS, RESTRICTIONS, GLOBAL_MAX_SIZE } from './restrictions';

export const FILE_TYPE_ERROR = 'FILE_TYPE_ERROR';
export const FILE_SIZE_ERROR = 'FILE_SIZE_ERROR';
export const VIDEO_LENGTH_TOO_LONG_ERROR = 'VIDEO_LENGTH_TOO_LONG_ERROR';
export const VIDEO_LENGTH_TOO_SHORT_ERROR = 'VIDEO_LENGTH_TOO_SHORT_ERROR';
/**
 * Checks whether a media is a video.
 *
 * @param {string} mime - The MIME tye of the media
 * @returns {boolean} Whether it is a video.
 */
export function isVideo( mime ) {
	return mime.split( '/' )[ 0 ] === 'video';
}

const getMin = ( a, b ) => Math.min( a ?? GLOBAL_MAX_SIZE, b ?? GLOBAL_MAX_SIZE );
const getMax = ( a, b ) => Math.max( a ?? 0, b ?? 0 );

const reduceVideoLimits = ( prev, current ) => ( {
	minSize: getMax( prev.minSize, current.minSize ),
	maxSize: getMin( prev.maxSize, current.maxSize ),
	maxLength: getMin( prev.maxLength, current.maxLength ),
	minLength: getMax( prev.minLength, current.minLength ),
} );

const getVideoLimits = enabledConnections =>
	enabledConnections
		.map( connection =>
			RESTRICTIONS[ connection.service_name ]
				? RESTRICTIONS[ connection.service_name ].video
				: DEFAULT_RESTRICTIONS.video
		)
		.reduce( reduceVideoLimits, [] );

/**
 * Returns the currently allowed media types
 *
 * @param {Array} enabledConnections - Currently enabled connections.
 * @returns {Array} Array of allowed types
 */
export const getAllowedMediaTypes = enabledConnections => {
	const typeArrays = enabledConnections.map( connection =>
		RESTRICTIONS[ connection.service_name ]
			? RESTRICTIONS[ connection.service_name ].allowedMediaTypes
			: DEFAULT_RESTRICTIONS.allowedMediaTypes
	);

	if ( typeArrays.length === 0 ) {
		return DEFAULT_RESTRICTIONS.allowedMediaTypes;
	}

	return typeArrays.reduce( ( a, b ) => a.filter( c => b.includes( c ) ) ); // Intersection
};

/**
 * Hooks to deal with the media restrictions
 *
 * @param {object} enabledConnections - Currently enabled connections.
 * @returns {Function} Social media connection handler.
 */
export default function useMediaRestrictions( enabledConnections ) {
	const maxImageSize = Math.min(
		...enabledConnections.map( connection =>
			RESTRICTIONS[ connection.service_name ]
				? RESTRICTIONS[ connection.service_name ].image.maxSize
				: DEFAULT_RESTRICTIONS.image.maxSize
		)
	);

	const [ videoLimits, allowedMediaTypes ] = useMemo(
		() => [ getVideoLimits( enabledConnections ), getAllowedMediaTypes( enabledConnections ) ],
		[ enabledConnections ]
	);

	/**
	 * This function is used to check if the provided image is valid based on it's size and type.
	 *
	 * @param {number} sizeInMb - The fileSize in bytes.
	 * @returns {FILE_SIZE_ERROR} Returns validation error.
	 */
	const getImageValidationError = useCallback(
		sizeInMb => {
			if ( ! sizeInMb || sizeInMb > maxImageSize ) {
				return FILE_SIZE_ERROR;
			}

			return null;
		},
		[ maxImageSize ]
	);

	/**
	 * This function is used to check if the provided video is valid based on it's size and type and length.
	 *
	 * @param {number} sizeInMb - The fileSize in bytes.
	 * @param {number} length - Video length in seconds and.
	 * @returns {(FILE_SIZE_ERROR | VIDEO_LENGTH_TOO_LONG_ERROR | VIDEO_LENGTH_TOO_SHORT_ERROR)} Returns validation error.
	 */
	const getVideoValidationError = useCallback(
		( sizeInMb, length ) => {
			const { minSize, maxSize, minLength, maxLength } = videoLimits;

			if ( ! sizeInMb || sizeInMb > maxSize || sizeInMb < minSize ) {
				return FILE_SIZE_ERROR;
			}

			if ( ! length || length < minLength ) {
				return VIDEO_LENGTH_TOO_SHORT_ERROR;
			}

			if ( length > maxLength ) {
				return VIDEO_LENGTH_TOO_LONG_ERROR;
			}

			return null;
		},
		[ videoLimits ]
	);

	/**
	 * Checks whether the media with the provided metaData is valid. It can validate images or videos.
	 *
	 * @param {number} metaData - Data for media.
	 * @returns {(FILE_SIZE_ERROR | FILE_TYPE_ERROR | VIDEO_LENGTH_TOO_SHORT_ERROR | VIDEO_LENGTH_TOO_LONG_ERROR)} Returns validation error.
	 */
	const getValidationError = useCallback(
		metaData => {
			const { mime, fileSize } = metaData;

			const isMimeValid = mimeToTest =>
				mimeToTest && allowedMediaTypes.includes( mimeToTest.toLowerCase() );

			if ( ! isMimeValid( mime ) ) {
				return FILE_TYPE_ERROR;
			}

			const sizeInMb = fileSize ? fileSize / Math.pow( 1000, 2 ) : null;

			return isVideo( mime )
				? getVideoValidationError( sizeInMb, metaData.length )
				: getImageValidationError( sizeInMb );
		},
		[ getImageValidationError, getVideoValidationError, allowedMediaTypes ]
	);

	return {
		maxImageSize,
		videoLimits,
		allowedMediaTypes,
		getValidationError,
	};
}
