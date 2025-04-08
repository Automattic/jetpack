/**
 * Definition for JSON types:
 * - JSONValue can be any value compatible with JSON; an object (containing JSONValues), array, string, number, boolean, or null
 * - JSONObject is an object containing JSONValues
 * - JSONSchema is a zod schema that can be used to validate JSONValues
 */
type Literal = string | number | boolean | null;
export type JSONValue = Literal | JSONObject | JSONValue[];
export type JSONObject = { [ key: string ]: JSONValue };
