/**
 * Whether a value is an absolute http(s) URL, and so safe to navigate to.
 *
 * @param value - The value, e.g. from a REST response.
 * @return True for a URL that parses and uses `http:` or `https:`.
 */
export function isHttpUrl( value: unknown ): value is string {
	if ( typeof value !== 'string' ) {
		return false;
	}
	try {
		const { protocol } = new URL( value );
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}
