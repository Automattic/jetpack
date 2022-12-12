import { useCallback } from 'react';

export const FILE_TYPE_ERROR = 'FILE_TYPE_ERROR';
export const FILE_SIZE_ERROR = 'FILE_SIZE_ERROR';
export const VIDEO_LENGTH_ERROR = 'VIDEO_LENGTH_ERROR';

const MP4 = 'video/mp4';
const MOV = 'video/mov';
/**
 * These restrictions were updated on: November 18, 2022.
 *
 * Image and video size is in MB.
 * Video length is in seconds.
 */
const allowedImageTypes = [ 'image/jpeg', 'image/jpg', 'image/png' ];
const RESTRICTIONS = {
	twitter: {
		allowedMediaTypes: allowedImageTypes.concat( [ MP4 ] ),
		image: {
			maxSize: 5,
		},
		video: {
			maxSize: 512,
			maxLength: 140,
		},
	},
	facebook: {
		allowedMediaTypes: allowedImageTypes.concat( [ MP4 ] ),
		image: {
			maxSize: 4,
		},
		video: {
			maxSize: 10000,
			maxLength: 14400,
		},
	},
	tumblr: {
		allowedMediaTypes: allowedImageTypes.concat( [ MP4, MOV ] ),
		image: {
			maxSize: 20,
		},
		video: {
			maxSize: 500,
			maxLength: 600,
		},
	},
	linkedin: {
		allowedMediaTypes: allowedImageTypes.concat( [ MP4 ] ),
		image: {
			maxSize: 20,
		},
		video: {
			minSize: 0.075,
			maxSize: 200,
			maxLength: 600,
			minLength: 3,
		},
	},
};

/**
 * Checks whether a media is a video.
 *
 * @param {string} mime - The MIME tye of the media
 * @returns {boolean} Whether it is a video.
 */
export function isVideo( mime ) {
	return mime.split( '/' )[ 0 ] === 'video';
}

const getMin = ( a, b ) => Math.min( a ?? Infinity, b ?? Infinity );
const getMax = ( a, b ) => Math.max( a ?? 0, b ?? 0 );

const reduceVideoLimits = ( prev, current ) => ( {
	minSize: getMax( prev.minSize, current.minSize ),
	maxSize: getMin( prev.maxSize, current.maxSize ),
	maxLength: getMin( prev.maxLength, current.maxLength ),
	minLength: getMax( prev.minLength, current.minLength ),
} );

/**
 * Hooks to deal with the media restrictions
 *
 * @param {object} enabledConnections - Currently enabled connections.
 * @returns {Function} Social media connection handler.
 */
export default function useMediaRestrictions( enabledConnections ) {
	const maxImageSize = Math.min(
		...enabledConnections.map( connection => RESTRICTIONS[ connection.service_name ].image.maxSize )
	);

	const videoLimits = enabledConnections
		.map( connection => RESTRICTIONS[ connection.service_name ].video )
		.reduce( reduceVideoLimits );

	/**
	 * Returns the currently allowed media types
	 *
	 * @returns {Array} Array of allowed types
	 */
	const getAllowedMediaTypes = useCallback( () => {
		const typeArrays = enabledConnections.map(
			connection => RESTRICTIONS[ connection.service_name ].allowedMediaTypes
		);
		return typeArrays.reduce( ( a, b ) => a.filter( c => b.includes( c ) ) ); // Intersection
	}, [ enabledConnections ] );

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
	 * @returns {(FILE_SIZE_ERROR | VIDEO_LENGTH_ERROR)} Returns validation error.
	 */
	const getVideoValidationError = useCallback(
		( sizeInMb, length ) => {
			const { minSize, maxSize, minLength, maxLength } = videoLimits;

			if ( ! sizeInMb || sizeInMb > maxSize || sizeInMb < minSize ) {
				return FILE_SIZE_ERROR;
			}

			if ( ! length || length > maxLength || length < minLength ) {
				return VIDEO_LENGTH_ERROR;
			}

			return null;
		},
		[ videoLimits ]
	);

	/**
	 * Checks whether the media with the provided metaData is valid. It can validate images or videos.
	 *
	 * @param {number} metaData - Data for media.
	 * @returns {(FILE_SIZE_ERROR | FILE_TYPE_ERROR | VIDEO_LENGTH_ERROR)} Returns validation error.
	 */
	const getValidationError = useCallback(
		metaData => {
			const { mime, fileSize, length } = metaData;

			const isMimeValid = mimeToTest =>
				mimeToTest && getAllowedMediaTypes().includes( mimeToTest.toLowerCase() );

			if ( ! isMimeValid( mime ) ) {
				return FILE_TYPE_ERROR;
			}

			const sizeInMb = fileSize ? fileSize / Math.pow( 1000, 2 ) : null;

			return isVideo( mime )
				? getVideoValidationError( sizeInMb, length )
				: getImageValidationError( sizeInMb );
		},
		[ getImageValidationError, getVideoValidationError, getAllowedMediaTypes ]
	);

	return {
		maxImageSize,
		videoLimits,
		getValidationError,
		getAllowedMediaTypes,
	};
}
