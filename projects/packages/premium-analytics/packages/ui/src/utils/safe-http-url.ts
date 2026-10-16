/**
 * Return a URL only when it is safe to use as an href.
 *
 * @param url                   - The candidate URL.
 * @param options               - Guard options.
 * @param options.allowRelative - Also accept a root-relative path. Only the file-download
 *                              sinks need it: the endpoint falls back to a root-relative
 *                              `relative_url` when it omits `download_url`.
 * @return The safe URL, otherwise null.
 */
export function safeHttpUrl(
	url: unknown,
	{ allowRelative = false }: { allowRelative?: boolean } = {}
): string | null {
	if ( typeof url !== 'string' || ! url ) {
		return null;
	}

	// URL parsing strips tab/newline and normalizes `\` to `/`, so inputs like `/\host` or
	// `/\t/host` resolve to another origin just as `//host` does. Resolve against a sentinel
	// base and only accept the path when it stays on that origin.
	if ( allowRelative && url.startsWith( '/' ) ) {
		try {
			const base = 'https://relative.invalid';
			return new URL( url, base ).origin === base ? url : null;
		} catch {
			return null;
		}
	}

	try {
		const { protocol } = new URL( url );
		return protocol === 'http:' || protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}
