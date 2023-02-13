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

export async function sleep( ms: number ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}
