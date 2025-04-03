/**
 * Removed falsy values from nested object.
 *
 * @param {*} object - Object to be cleaned.
 * @return {*} Object cleaned from falsy values.
 */
const cleanEmptyObject = object => {
	if ( object === null || typeof object !== 'object' || Array.isArray( object ) ) {
		return object;
	}

	const cleanedNestedObjects = Object.entries( object )
		.map( ( [ key, value ] ) => [ key, cleanEmptyObject( value ) ] )
		.filter( ( [ , value ] ) => value !== undefined );
	return ! cleanedNestedObjects.length ? undefined : Object.fromEntries( cleanedNestedObjects );
};

export default cleanEmptyObject;
