// Recursively map all object keys to camelCase
// This supports conversion from kebab-case and snake_case to camelCase
const mapObjectKeysToCamel = ( item: unknown ) => {
	if ( Array.isArray( item ) ) {
		return item.map( ( el: unknown ) => mapObjectKeysToCamel( el ) );
	} else if ( typeof item === 'function' || item !== Object( item ) ) {
		return item;
	}
	return Object.fromEntries(
		Object.entries( item as unknown ).map( ( [ key, value ]: [ string, unknown ] ) => [
			key.replace( /([-_][a-z])/gi, c => c.toUpperCase().replace( /[-_]/g, '' ) ),
			mapObjectKeysToCamel( value ),
		] )
	);
};

export default mapObjectKeysToCamel;
