const toString = Object.prototype.toString;

/**
 * Flattens a nested object into `a[b][0]` style query string keys, skipping null values.
 *
 * @param {object|Array} obj - Object to flatten.
 * @param {string}       [path] - Key prefix, used when recursing.
 * @param {object}       [result] - Accumulator, used when recursing.
 * @return {object|Array|undefined} Flat key/value map, or undefined for non-objects.
 */
export function flatten( obj, path, result ) {
	const type = toString.call( obj );
	if ( result === undefined ) {
		if ( type === '[object Object]' ) {
			result = {};
		} else if ( type === '[object Array]' ) {
			result = [];
		} else {
			return;
		}
	}

	for ( const key of Object.keys( obj ) ) {
		const val = obj[ key ];
		if ( val == null ) {
			continue;
		}
		const joined = path != null ? `${ path }[${ key }]` : key;
		const valType = toString.call( val );
		if ( valType === '[object Array]' || valType === '[object Object]' ) {
			flatten( val, joined, result );
		} else {
			result[ joined ] = val;
		}
	}
	return result;
}

/**
 * Encodes an object as a query string, repeating the key for array values.
 *
 * @param {object} obj - Object to encode.
 * @return {string} Query string without a leading `?`.
 */
export function encode( obj ) {
	const parts = [];
	for ( const key in obj ) {
		const val = obj[ key ];
		if ( val === undefined ) {
			continue;
		}
		for ( const item of Array.isArray( val ) ? val : [ val ] ) {
			parts.push( `${ encodeURIComponent( key ) }=${ encodeURIComponent( item ) }` );
		}
	}
	return parts.join( '&' );
}
