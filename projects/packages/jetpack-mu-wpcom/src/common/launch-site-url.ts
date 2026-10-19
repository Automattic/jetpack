const LAUNCH_SITE_FLOW_URL = 'https://wordpress.com/setup/launch-site';

/**
 * Build the Calypso launch-flow URL for a site.
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

	return currentUrl ? withBackTo( url.href, currentUrl ) : url.href;
}

/**
 * Point a launch-flow URL's `back_to` at a page, replacing any it already has.
 *
 * Calypso drops a `back_to` unless it is https on the launched site's host, so the page's own host is
 * swapped for the URL's `siteSlug`.
 *
 * @param launchUrl  - A launch-flow URL carrying `siteSlug`.
 * @param currentUrl - The page the flow's Back button returns to.
 * @return The launch-flow URL.
 */
export function withBackTo( launchUrl: string, currentUrl: string ): string {
	const url = new URL( launchUrl );
	const { pathname, search, hash } = new URL( currentUrl );
	url.searchParams.set(
		'back_to',
		`https://${ url.searchParams.get( 'siteSlug' ) }${ pathname }${ search }${ hash }`
	);

	return url.href;
}
