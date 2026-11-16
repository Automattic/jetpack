/**
 * A site URL as people read it: no scheme, no trailing slash.
 *
 * The path stays, so two subdirectory installs on one host still read as different sites.
 *
 * @param url - The site URL.
 * @return The address, e.g. `example.com/blog`.
 */
export function formatSiteAddress( url: string ): string {
	return url
		.trim()
		.replace( /^https?:\/\//i, '' )
		.replace( /\/+$/, '' );
}
