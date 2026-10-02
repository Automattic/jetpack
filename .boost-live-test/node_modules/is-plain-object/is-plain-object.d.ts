/**
 * Returns true if an object was created by the `Object` constructor, or Object.create(null).
 * 
 * @param value The value to test
 */
export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown>;
