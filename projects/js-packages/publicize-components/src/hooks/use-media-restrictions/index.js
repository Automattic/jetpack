import { useCallback } from 'react';

/**
 * These restrictions were updated on: November 18, 2022
 *
 * Image size is in MB
 */
const RESTRICTIONS = {
	twitter: {
		maxImageSize: 2,
		allowedImageTypes: [ 'image/jpeg', 'image/jpg', 'image/png' ],
	},
	facebook: {
		maxImageSize: 1,
		allowedImageTypes: [ 'image/jpeg', 'image/jpg', 'image/png' ],
	},
	tumblr: {
		maxImageSize: 20,
		allowedImageTypes: [ 'image/jpeg', 'image/png' ],
	},
	linkedin: {
		maxImageSize: 5,
		allowedImageTypes: [ 'image/jpeg', 'image/png' ],
	},
};

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

	const typeArrays = Object.keys( RESTRICTIONS ).map(
		service => RESTRICTIONS[ service ].allowedImageTypes
	);
	const allowedImageTypes = typeArrays.reduce( ( a, b ) => a.filter( c => b.includes( c ) ) ); // Intersection

	/**
	 * This function is used to check if the provided image is valid based on it's size and type.
	 *
	 * @param {number} sizeInBytes - Size of the image in bytes.
	 * @param {string} mime - MIME type of the image.
	 * @returns {number} Returns validation error. 1 - Type error, 2 - Size error
	 */
	const getValidationError = useCallback(
		( sizeInBytes, mime ) => {
			const sizeInMb = sizeInBytes / Math.pow( 1000, 2 );

			if ( ! allowedImageTypes.includes( mime.toLowerCase() ) ) {
				return 1;
			}

			if ( sizeInMb >= maxImageSize ) {
				return 2;
			}

			return null;
		},
		[ maxImageSize, allowedImageTypes ]
	);

	return {
		maxImageSize,
		allowedImageTypes,
		getValidationError,
	};
}
