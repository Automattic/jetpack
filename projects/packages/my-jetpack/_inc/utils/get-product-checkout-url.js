// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

/**
 * Return the checkout URL for the given product.
 * It checkes whether the user is connected to Jetpack.
 * It doesn't use Jetpack redirect because
 * there is an issue with the `redirect_to` param.
 *
 * @param {string} product          - Checkout product name
 * @param {boolean} isUserConnected - True when the user is connected Jetpack
 * @returns {string} the redirect URL
 */
export default function getProductCheckoutUrl( product, isUserConnected ) {
	const { siteSuffix, myJetpackUrl } = window?.myJetpackInitialState || {};

	const checkoutUrl = new URL( 'https://wordpress.com/checkout/' );
	const checkoutProductUrl = new URL( `${ checkoutUrl }${ siteSuffix }/${ product }` );

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set( 'redirect_to', myJetpackUrl );

	// Add unlinked when user is not connected to Jetpack.
	if ( ! isUserConnected ) {
		checkoutProductUrl.searchParams.set( 'unlinked', 1 );
	}

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', siteSuffix );

	return checkoutProductUrl.toString();
}
