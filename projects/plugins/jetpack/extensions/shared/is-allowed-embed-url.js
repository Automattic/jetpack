/**
 * Return the normalized URL when it is HTTPS on an allowed host, or an empty string.
 *
 * Call it before rendering, not after a server-side check.
 *
 * @param {string}               url            - The URL to validate.
 * @param {Array<string|RegExp>} [allowedHosts] - Allowed hosts. A string matches that host or any subdomain of it; a RegExp is tested against the lower-cased host.
 * @return {string} The normalized URL, or an empty string when it is not allowed.
 */
export function getAllowedEmbedUrl( url, allowedHosts = [] ) {
	if ( typeof url !== 'string' ) {
		return '';
	}

	let parsed;
	try {
		parsed = new URL( url );
	} catch {
		return '';
	}

	if ( 'https:' !== parsed.protocol ) {
		return '';
	}

	const host = parsed.hostname.toLowerCase();
	const isAllowed = allowedHosts.some( allowed => {
		if ( allowed instanceof RegExp ) {
			return allowed.test( host );
		}
		const allowedHost = String( allowed ).toLowerCase();
		return host === allowedHost || host.endsWith( `.${ allowedHost }` );
	} );

	return isAllowed ? parsed.href : '';
}

/**
 * Whether a URL is HTTPS on an allowed host.
 *
 * @param {string}               url            - The URL to validate.
 * @param {Array<string|RegExp>} [allowedHosts] - Allowed hosts, as accepted by getAllowedEmbedUrl().
 * @return {boolean} True when the URL is `https:` and its host is allowed.
 */
export default function isAllowedEmbedUrl( url, allowedHosts = [] ) {
	return '' !== getAllowedEmbedUrl( url, allowedHosts );
}
