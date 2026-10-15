const LAUNCH_SITE_FLOW_URL = 'https://wordpress.com/setup/launch-site';

/**
 * Build the Calypso launch-flow URL for a site.
 *
 * Calypso drops a `back_to` unless it is https on the launched site's host, so the page's own host is
 * swapped for `siteSlug`.
 *
 * @param siteSlug   - The host of the site's home URL.
 * @param currentUrl - The page the flow's Back button returns to, if any.
 * @param args       - Query args to add, or to override `ref` with.
 * @return The launch-flow URL.
 */
export function getLaunchSiteUrl(
	siteSlug: string,
	currentUrl?: string,
	args: Record< string, string > = {}
): string {
	const url = new URL( LAUNCH_SITE_FLOW_URL );
	url.search = new URLSearchParams( { siteSlug, ref: 'wp-admin', ...args } ).toString();

	if ( currentUrl ) {
		const { pathname, search, hash } = new URL( currentUrl );
		url.searchParams.set( 'back_to', `https://${ siteSlug }${ pathname }${ search }${ hash }` );
	}

	return url.href;
}
