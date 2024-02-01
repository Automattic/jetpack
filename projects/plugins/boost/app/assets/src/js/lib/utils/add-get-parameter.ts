/**
 * Helper function to add a get parameter to the end of the supplied URL.
 *
 * @param {string} url   - URL to add the parameter to.
 * @param {string} key   - Parameter key.
 * @param {string} value - Parameter value.
 * @return {string} - URL with the parameter added.
 */
export function addGetParameter( url: string, key: string, value: string ): string {
	const urlObject = new URL( url );
	urlObject.searchParams.set( key, value );

	return urlObject.toString();
}
