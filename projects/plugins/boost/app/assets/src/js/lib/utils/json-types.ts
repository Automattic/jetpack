/* eslint-disable no-use-before-define */

import { z } from 'zod';

/**
 * JSONSchema: A zod description of a JSON object.
 */
const d = z.union( [ z.string(), z.number(), z.boolean(), z.null() ] );
type Literal = z.infer< typeof d >;
export const JSONSchema: z.ZodType< JSONValue > = z.lazy( () =>
	z.union( [ d, z.array( JSONSchema ), z.record( JSONSchema ) ] )
);

/**
 * TypeScript types for JSON values.
 */
export type JSONValue = Literal | JSONObject | JSONValue[];
export type JSONObject = { [ key: string ]: JSONValue };
export type JSONArray = JSONValue[];

/**
 * Returns true if the given JSONValue is a JSONObject.
 *
 * @param {JSONValue} value - Value to check.
 */
export function isJsonObject( value: JSONValue ): value is JSONObject {
	return !! value && value instanceof Object && ! ( value instanceof Array );
}

/**
 * Returns true if the given JSONValue is a JSONArray.
 * Sure, you could use x instanceof Array but this is shorter and more consistent.
 *
 * @param {JSONValue} value - Value to check.
 */
export function isJsonArray( value: JSONValue ): value is JSONArray {
	return value instanceof Array;
}
