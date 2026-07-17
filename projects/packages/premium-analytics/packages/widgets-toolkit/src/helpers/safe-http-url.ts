/**
 * Returns a remote URL only when it is safe to use as an `href`, so report data
 * cannot smuggle a clickable `javascript:`/`data:` protocol into an anchor.
 *
 * Every remote URL rendered as a link must pass through this. Nothing upstream
 * enforces the scheme: it is not part of any Stats endpoint's contract,
 * `@wordpress/ui`'s `Link` spreads `href` straight onto the anchor, and React 18
 * only warns about `javascript:` hrefs in development builds while rendering them
 * unchanged in production.
 *
 * Parsing with `new URL()` rather than matching the string is deliberate: it
 * normalizes the case, whitespace, control-character and embedded-newline
 * evasions (`JaVaScRiPt:`, `java\tscript:`) that a prefix check would miss.
 *
 * Takes `unknown` because report fields are untyped at the edge — several Stats
 * items carry `link` as `unknown` — so callers need not narrow before asking.
 *
 * @param url - The candidate URL from report data.
 * @return The original URL when it is http(s) or a root-relative path, else null.
 */
export function safeHttpUrl( url: unknown ): string | null {
	if ( typeof url !== 'string' || ! url ) {
		return null;
	}

	// A root-relative path carries no scheme of its own and resolves against the
	// page origin, so it is safe as-is. The file-downloads report relies on this:
	// it falls back to a relative `relative_url` when the API omits `download_url`.
	// `//host` is excluded — it is protocol-relative, not root-relative.
	if ( url.startsWith( '/' ) && ! url.startsWith( '//' ) ) {
		return url;
	}

	try {
		const { protocol } = new URL( url );
		return protocol === 'http:' || protocol === 'https:' ? url : null;
	} catch {
		// Not a parseable absolute URL — e.g. a bare label like 'WordPress Dashboard'.
		return null;
	}
}
