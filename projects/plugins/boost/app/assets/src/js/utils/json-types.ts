/* eslint-disable no-use-before-define */
/**
 * Generic type for handling JSON-like objects.
 *
 * Use this as a last resort if you can't reasonably describe the possible shapes an object can take.
 */
export type JSONObject = {
	[ key: string ]: JSONValue;
};
export type JSONArray = JSONValue[];
export type JSONValue = string | number | boolean | JSONObject | JSONArray | null | undefined;

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
