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

	// `\` normalizes to `/` in special schemes, so `/\host` resolves to another origin just
	// as `//host` does. Neither is root-relative.
	if ( allowRelative && url.startsWith( '/' ) && ! /^\/[/\\]/.test( url ) ) {
		return url;
	}

	try {
		const { protocol } = new URL( url );
		return protocol === 'http:' || protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}
