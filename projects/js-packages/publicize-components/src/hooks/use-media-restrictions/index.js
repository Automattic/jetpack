import { useCallback } from 'react';

export const FILE_TYPE_ERROR = 'FILE_TYPE_ERROR';
export const FILE_SIZE_ERROR = 'FILE_SIZE_ERROR';

/**
 * These restrictions were updated on: November 18, 2022
 *
 * Image size is in MB
 */
const allowedImageTypes = [ 'image/jpeg', 'image/jpg', 'image/png' ];
const RESTRICTIONS = {
	twitter: {
		maxImageSize: 5,
		allowedImageTypes,
	},
	facebook: {
		maxImageSize: 4,
		allowedImageTypes,
	},
	tumblr: {
		maxImageSize: 20,
		allowedImageTypes,
	},
	linkedin: {
		maxImageSize: 5,
		allowedImageTypes,
	},
};

/**
 * Returns the currently allowed media types
 *
 * @returns {Array} Array of allowed types
 */
export function getAllowedMediaTypes() {
	const typeArrays = Object.keys( RESTRICTIONS ).map(
		service => RESTRICTIONS[ service ].allowedImageTypes
	);
	return typeArrays.reduce( ( a, b ) => a.filter( c => b.includes( c ) ) ); // Intersection
}

/**
 * Hooks to deal with the media restrictions
 *
 * @param {object} enabledConnections - Currently enabled connections.
 * @returns {Function} Social media connection handler.
 */
export default function useMediaRestrictions( enabledConnections ) {
	const maxImageSize = Math.min(
		...enabledConnections.map( connection => RESTRICTIONS[ connection.service_name ].maxImageSize )
	);

	/**
	 * This function is used to check if the provided image is valid based on it's size and type.
	 *
	 * @param {number} sizeInBytes - Size of the image in bytes.
	 * @param {string} mime - MIME type of the image.
	 * @returns {number} Returns validation error. 1 - Type error, 2 - Size error
	 */
	const getValidationError = useCallback(
		( sizeInBytes, mime ) => {
			const sizeInMb = sizeInBytes ? sizeInBytes / Math.pow( 1000, 2 ) : null;

			if ( ! mime || ! getAllowedMediaTypes().includes( mime.toLowerCase() ) ) {
				return FILE_TYPE_ERROR;
			}

			if ( ! sizeInMb || sizeInMb >= maxImageSize ) {
				return FILE_SIZE_ERROR;
			}

			return null;
		},
		[ maxImageSize ]
	);

	return {
		maxImageSize,
		getValidationError,
	};
}
