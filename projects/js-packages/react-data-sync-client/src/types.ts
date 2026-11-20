import { z } from 'zod';

// Zod 4's `ZodType` infers `unknown`; DataSync's generics rely on Zod 3's `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySchema = z.ZodType< any >;

/**
 * A syncable value with a nonce that's parsed by Zod.
 */
export type ParsedValue< T extends AnySchema > = {
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
	z.union( [ literalSchema, z.array( jsonSchema ), z.record( z.string(), jsonSchema ) ] )
);
export type JSONSchema = z.infer< typeof jsonSchema >;
