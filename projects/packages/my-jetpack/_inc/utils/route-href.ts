/**
 * The boot router's current href (path, search and hash), read the way its history reads it.
 *
 * @return The href, such as `/features?feature=stats`.
 */
export function getRouteHref(): string {
	const url = new URL( window.location.href );

	return ( url.searchParams.get( 'p' ) || '/' ) + url.hash;
}

/**
 * The href a link from before My Jetpack moved to the boot router (`#/add-backup?x=1`) stands for.
 *
 * Boot reads such a link as `/` plus a hash; the hash is never sent to the server, so only the page can redirect it.
 *
 * @param hash - A location hash.
 * @return The href, or null for any other hash, such as `#wpbody-content`.
 */
export function getLegacyHashHref( hash: string ): string | null {
	return /^#\/./.test( hash ) ? hash.slice( 1 ) : null;
}
