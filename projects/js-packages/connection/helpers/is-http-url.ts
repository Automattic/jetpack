/**
 * Whether a value is an absolute http(s) URL, and so safe to link or navigate to.
 *
 * @param value - The value, often from a PHP filter or a REST response.
 * @return True for a string starting with `http://` or `https://`.
 */
export function isHttpUrl( value: unknown ): value is string {
	return typeof value === 'string' && /^https?:\/\//i.test( value );
}
