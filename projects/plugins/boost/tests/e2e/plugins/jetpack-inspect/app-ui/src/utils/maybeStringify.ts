import type { JSONSchema } from '@src/utils/Validator';

export function maybeStringify< T >( value: JSONSchema | string ): string | T {
	if ( typeof value === 'string' ) {
		return value;
	}

	try {
		return JSON.stringify( value, null, 2 );
	} catch ( _e ) {
		return value as T;
	}
}
