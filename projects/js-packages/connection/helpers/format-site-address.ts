/**
 * A site URL as people read it: no scheme, no trailing slash.
 *
 * The path stays, so two subdirectory installs on one host still read as different sites.
 *
 * @param url - The site URL.
 * @return The address, e.g. `example.com/blog`.
 */
export function formatSiteAddress( url: string ): string {
	const address = url.trim().replace( /^https?:\/\//i, '' );

	// Keep this a loop: /\/+$/ backtracks quadratically on a long run of slashes mid-string.
	let end = address.length;
	while ( end > 0 && address[ end - 1 ] === '/' ) {
		end--;
	}

	return address.slice( 0, end );
}
