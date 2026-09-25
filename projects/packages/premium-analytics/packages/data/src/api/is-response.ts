/**
 * Whether a value is a fetch `Response`.
 *
 * Shape-checked rather than `instanceof Response`: a `Response` created in
 * another realm fails the `instanceof` check, and the constructor is not a
 * global in every environment the data layer runs its tests in.
 *
 * @param value - The value to test.
 * @return Whether the value is a `Response`.
 */
export function isResponse( value: unknown ): value is Response {
	return (
		typeof value === 'object' &&
		value !== null &&
		'status' in value &&
		typeof value.status === 'number' &&
		'json' in value &&
		typeof value.json === 'function'
	);
}
