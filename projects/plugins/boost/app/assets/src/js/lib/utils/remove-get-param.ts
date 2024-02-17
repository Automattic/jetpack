/**
 * Helper utility to remove a GET parameter from the specified URL.
 *
 * @param {string} url   - URL to remove GET parameter from
 * @param {string} param - Name of the get param to remove.
 */
export function removeGetParam( url: string, param: string ): string {
	const urlObject = new window.URL( url );
	urlObject.searchParams.delete( param );

	return urlObject.toString();
}
