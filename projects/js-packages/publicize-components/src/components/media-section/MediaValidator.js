/**
 * These restrictions were updated on: November 18, 2022
 *
 * Image size is in MB
 */
const RESTRICTIONS = {
	twitter: {
		maxImageSize: 5,
		allowedImageTypes: [ 'image/jpeg', 'image/jpg', 'image/png' ],
	},
	facebook: {
		maxImageSize: 4,
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
 * This is a utility class to help decide the media restrictions for media uploads,
 * based on the currently enabled connections.
 */
class MediaValidator {
	constructor( availableConnections ) {
		this.connections = availableConnections;
		this._maxImageSize = this._getMaxImageSize();
		this._allowedImageTypes = this._getAllowedImageTypes();
	}

	/**
	 * Returns the maximum uploadable image size based on the active connections.
	 *
	 * @returns {number} Maximum size of image in MB.
	 */
	get maxImageSize() {
		return this._maxImageSize;
	}

	get allowedImageTypes() {
		return this._allowedImageTypes;
	}

	_getMaxImageSize() {
		return Math.min(
			...this.connections.map( connection => RESTRICTIONS[ connection.service_name ].maxImageSize )
		);
	}

	_getAllowedImageTypes() {
		const typeArrays = Object.keys( RESTRICTIONS ).map(
			service => RESTRICTIONS[ service ].allowedImageTypes
		);
		return typeArrays.reduce( ( a, b ) => a.filter( c => b.includes( c ) ) ); // Intersection
	}

	/**
	 * This function is used to check if the provided image is valid based on it's size and type.
	 *
	 * @param {number} sizeInBytes - Size of the image in bytes.
	 * @param {string} mime - MIME type of the image.
	 * @returns {boolean} If the image is valid.
	 */
	isImageValid( sizeInBytes, mime ) {
		const sizeInMb = sizeInBytes / Math.pow( 1000, 2 );

		return sizeInMb <= this._maxImageSize && this._allowedImageTypes.includes( mime.toLowerCase() );
	}
}

export { MediaValidator };
