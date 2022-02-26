/**
 * Checks if the URL is a relative URL.
 *
 * @param {string} url - URL to be checked.
 * @returns {boolean} Result.
 */
export const isRelativeUrl = ( url: string ): boolean =>
	! url.includes( ':' ) && ! url.includes( '//' );

/**
 * Checks if the two URLs share a common host.
 *
 * @param {string} url1 - URL to be compared.
 * @param {string} url2 - URL to be compared.
 * @returns {boolean} Result.
 */
export function hasSameHost( url1: string, url2: string ): boolean {
	if ( isRelativeUrl( url1 ) || isRelativeUrl( url2 ) ) {
		return true;
	}

	// URL can't handle protocol-relative URLs. Convert them into HTTPS.
	if ( url1.startsWith( '//' ) ) {
		url1 = 'https:' + url1;
	}
	if ( url2.startsWith( '//' ) ) {
		url2 = 'https:' + url2;
	}

	try {
		const { host: host1 } = new URL( url1 );
		const { host: host2 } = new URL( url2 );
		return host1 === host2;
	} catch {
		return false;
	}
}
