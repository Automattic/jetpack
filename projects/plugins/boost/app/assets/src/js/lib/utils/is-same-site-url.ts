/**
 * Returns true if the provided URL is from the same domain as the provided site URL.
 *
 * @param {URL} url     URL to check.
 * @param {URL} siteUrl Site URL to compare against.
 */
export function isSameSiteUrl( url: URL, siteUrl: URL ): boolean {
	const urlSanitized = url.origin + url.pathname.replace( /\/$/, '' ) + '/';
	const siteUrlSanitized = siteUrl.origin + siteUrl.pathname.replace( /\/$/, '' ) + '/';
	return urlSanitized.startsWith( siteUrlSanitized );
}
