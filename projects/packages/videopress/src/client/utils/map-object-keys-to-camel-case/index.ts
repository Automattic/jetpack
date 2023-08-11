/**
 * Convert snake case string to camel case string.
 *
 * @param {string} string - String to convert.
 * @returns {string} 	  - Converted string.
 */
export function snakeToCamel( string ) {
	return string.replace( /([-_][a-z])/gi, $1 => {
		return $1.toUpperCase().replace( '_', '' );
	} );
}

/**
 * Check is the string has snake shape.
 *
 * @param {string} string - String to check.
 * @returns {boolean}      - True if the string has snake shape.
 */
function isSnake( string ) {
	return string.indexOf( '_' ) !== -1;
}

/**
 * Map object keys to camel case, in case they have snake shape.
 *
 * @param {object}  originalObject     - Object to be converted.
 * @param {boolean} deleteOriginalProp - Whether to delete the original property. False by default.
 * @returns {object}                   - Converted object.
 */
export function mapObjectKeysToCamel( originalObject, deleteOriginalProp = false ) {
	// avoid to override original object
	const object = Object.assign( {}, originalObject );

	for ( const key in object ) {
		if ( object.hasOwnProperty( key ) && isSnake( key ) ) {
			object[ snakeToCamel( key ) ] = object[ key ];

			if ( deleteOriginalProp ) {
				delete object[ key ];
			}
		}
	}

	return object;
}
