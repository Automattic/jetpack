/**
 * Helper utility to remove all GET parameters from the specified URL.
 *
 * @param {string} url - URL to remove GET parameters from.
 */
export function removeGetParams( url: string ): string {
	return url.split( '?' )[ 0 ];
}
