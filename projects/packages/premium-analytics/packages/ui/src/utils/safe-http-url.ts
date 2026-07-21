/**
 * Return a URL only when it parses with an HTTP or HTTPS scheme.
 *
 * @param url - The candidate URL.
 * @return The safe HTTP(S) URL, or null when it is missing, unparseable, or uses another scheme.
 */
export function safeHttpUrl( url: string | undefined ): string | null {
	if ( ! url ) {
		return null;
	}

	try {
		const { protocol } = new URL( url );
		return protocol === 'http:' || protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}
