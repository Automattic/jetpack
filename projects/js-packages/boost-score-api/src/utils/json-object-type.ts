import { z } from 'zod';

/**
 * Definition for JSON types:
 * - JSONValue can be any value compatible with JSON; an object (containing JSONValues), array, string, number, boolean, or null
 * - JSONObject is an object containing JSONValues
 * - JSONSchema is a zod schema that can be used to validate JSONValues
 */
const literalSchema = z.union( [ z.string(), z.number(), z.boolean(), z.null() ] );
type Literal = z.infer< typeof literalSchema >;
export type JSONValue = Literal | JSONObject | JSONValue[];
export type JSONObject = { [ key: string ]: JSONValue };
