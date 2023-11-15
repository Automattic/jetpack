import { initializeClient } from '@automattic/jetpack-svelte-data-sync-client';
import { z } from 'zod';

export const jetpack_boost_ds = initializeClient( 'jetpack_boost_ds' );

/**
 * Definition for JSON types:
 * - JSONValue can be any value compatible with JSON; an object (containing JSONValues), array, string, number, boolean, or null
 * - JSONObject is an object containing JSONValues
 * - JSONSchema is a zod schema that can be used to validate JSONValues
 */
const d = z.union( [ z.string(), z.number(), z.boolean(), z.null() ] );
type Literal = z.infer< typeof d >;
export type JSONValue = Literal | JSONObject | JSONValue[];
export type JSONObject = { [ key: string ]: JSONValue };
export const JSONSchema: z.ZodType< JSONValue > = z.lazy( () =>
	z.union( [ d, z.array( JSONSchema ), z.record( JSONSchema ) ] )
);
