/**
 * Return the checkout URL for the given product.
 *
 * @param {string} productSlug      - wpcom product slug.
 * @param {string} siteSuffix	    - Site suffix
 * @param {string} redirectUrl	    - Redirect URL used to define redirect_to
 * @param {boolean} isUserConnected - True when the user is connected Jetpack
 * @returns {string}                  The Calypso checkout URL
 */
export default function getProductCheckoutUrl(
	productSlug: string,
	siteSuffix: string,
	redirectUrl: string,
	isUserConnected: boolean
) {
	const checkoutUrl = new URL( 'https://wordpress.com/checkout/' );
	const checkoutProductUrl = new URL( `${ checkoutUrl }${ siteSuffix }/${ productSlug }` );

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set( 'redirect_to', redirectUrl );

	// Add unlimited when user is not connected to Jetpack.
	if ( ! isUserConnected ) {
		checkoutProductUrl.searchParams.set( 'unlinked', '1' );
	}

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', siteSuffix );

	return checkoutProductUrl.toString();
}
