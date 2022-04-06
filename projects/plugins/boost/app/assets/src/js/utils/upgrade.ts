/**
 * Internal dependencies
 */
import config from '../stores/config';

/**
 * Get the URL to upgrade boost.
 *
 * Ideally this function should not exist and
 * `getRedirectUrl( 'boost-plugin-upgrade-default', { site: config.site.domain, query, anchor: 'purchased' } )`
 * should be used instead. However, the redirect changes the redirect URL in a broken manner.
 */
export function getUpgradeURL() {
	const siteSuffix = config.site.domain;
	const product = 'jetpack_boost_monthly';

	const redirectUrl = new URL( window.location.href );
	redirectUrl.hash = '#/purchase-successful';

	// Prepare the redirect url
	// url.searchParams.set( 'purchase', 'success' );

	const checkoutUrl = new URL( 'https://wordpress.com/checkout/' );
	const checkoutProductUrl = new URL( `${ config.site.domain }/${ product }`, checkoutUrl );

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set( 'redirect_to', redirectUrl.toString() );

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', siteSuffix );

	return checkoutProductUrl.toString();
}
