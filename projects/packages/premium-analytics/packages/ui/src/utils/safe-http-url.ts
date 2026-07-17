/**
 * Return a URL only when it is safe to use as an href.
 *
 * @param url - The candidate URL.
 * @return The safe HTTP(S) URL or root-relative path, otherwise null.
 */
export function safeHttpUrl( url: unknown ): string | null {
	if ( typeof url !== 'string' || ! url ) {
		return null;
	}

	if ( url.startsWith( '/' ) && ! url.startsWith( '//' ) ) {
		return url;
	}

	try {
		const { protocol } = new URL( url );
		return protocol === 'http:' || protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}
