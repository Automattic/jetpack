import { z } from 'zod';

/**
 * A syncable value with a nonce that's parsed by Zod.
 */
export type ParsedValue< T extends z.ZodSchema > = {
	value: z.infer< T >;
	nonce: string;
};

export type SyncedStoreError< T > = {
	time: number;
	status: number | string;
	message: string;
	location: string;
	value: T;
	previousValue: T;
};

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
