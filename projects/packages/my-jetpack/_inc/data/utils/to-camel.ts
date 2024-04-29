import { ToCamelCase } from '../types';

const mapObjectKeysToCamel = < T >( item: T ): ToCamelCase< T > => {
	if ( Array.isArray( item ) ) {
		return item.map( el => mapObjectKeysToCamel( el ) ) as ToCamelCase< T >;
	} else if ( typeof item === 'object' && item !== null ) {
		return Object.fromEntries(
			Object.entries( item ).map( ( [ key, value ] ) => [
				key.replace( /([-_][a-z])/gi, c => c.toUpperCase().replace( /[-_]/g, '' ) ),
				mapObjectKeysToCamel( value ),
			] )
		) as ToCamelCase< T >;
	}
	return item as ToCamelCase< T >;
};

export default mapObjectKeysToCamel;
