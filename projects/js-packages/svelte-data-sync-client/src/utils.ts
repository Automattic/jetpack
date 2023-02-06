import { z } from 'zod';

/**
 * JSON Schema form Zod
 * Straight out of the docs:
 * https://github.com/colinhacks/zod
 */

const literalSchema = z.union( [ z.string(), z.number(), z.boolean(), z.null() ] );
type Literal = z.infer< typeof literalSchema >;
type Json = Literal | { [ key: string ]: Json } | Json[];

export const jsonSchema: z.ZodType< Json > = z.lazy( () =>
	z.union( [ literalSchema, z.array( jsonSchema ), z.record( jsonSchema ) ] )
);
export type JSONSchema = z.infer< typeof jsonSchema >;

/**
 * Tries to stringify an object, returns the original value if it cannot.
 *
 * @param {JSONSchema | string} value - The value to stringify.
 * @returns {*} - The stringified value or the original value.
 */
export function maybeStringify< T >( value: JSONSchema | string ): string | T {
	if ( typeof value === 'string' ) {
		return value;
	}

	try {
		return JSON.stringify( value, null, 2 );
	} catch ( _e ) {
		return ( value as unknown ) as T;
	}
}

export async function sleep( ms: number ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}
