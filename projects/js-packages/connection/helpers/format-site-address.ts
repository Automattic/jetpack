/**
 * A site URL as people read it: no scheme, no trailing slash.
 *
 * The path stays, so two subdirectory installs on one host still read as different sites.
 *
 * @param url - The site URL, with or without a scheme. Optional, like the Safe Mode state's URLs.
 * @return The address, e.g. `example.com/blog`, or '' without a URL.
 */
export function formatSiteAddress( url?: string ): string {
	if ( typeof url !== 'string' ) {
		return '';
	}
	const address = url.trim().replace( /^https?:\/\//i, '' );

	// Keep this a loop: /\/+$/ backtracks quadratically on a long run of slashes mid-string.
	let end = address.length;
	while ( end > 0 && address[ end - 1 ] === '/' ) {
		end--;
	}

	return address.slice( 0, end );
}

/**
 * Whether an address is an IP address rather than a domain.
 *
 * @param address - An address from `formatSiteAddress()`, e.g. `203.0.113.5:8080/blog`.
 * @return True for an IPv4 address or a bracketed IPv6 address, with or without a port.
 */
export function isIpAddress( address: string ): boolean {
	const host = address.split( '/' )[ 0 ];
	return (
		/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test( host ) || /^\[[\da-f:.]+\](?::\d+)?$/i.test( host )
	);
}
