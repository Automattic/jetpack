import { get } from 'svelte/store';
import config from '../stores/config';
import { isUserConnected } from '../stores/connection';

/**
 * Get the URL to upgrade boost.
 *
 * Ideally this function should not exist and
 * `getRedirectUrl( 'boost-plugin-upgrade-default', { site: config.site.domain, query, anchor: 'purchased' } )`
 * should be used instead. However, the redirect changes the redirect URL in a broken manner.
 */
export function getUpgradeURL() {
	const siteSuffix = get( config ).site.domain;
	const product = 'jetpack_boost_yearly';

	const redirectUrl = new URL( window.location.href );
	redirectUrl.hash = '#/purchase-successful';

	const checkoutProductUrl = new URL(
		`https://wordpress.com/checkout/${ siteSuffix }/${ product }`
	);

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set( 'redirect_to', redirectUrl.toString() );

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', siteSuffix );

	// If not connected, add unlinked=1 to query string to tell wpcom to connect the site.
	if ( ! isUserConnected() ) {
		checkoutProductUrl.searchParams.set( 'unlinked', '1' );
	}

	return checkoutProductUrl.toString();
}
