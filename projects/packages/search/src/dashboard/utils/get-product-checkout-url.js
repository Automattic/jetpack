/**
 *
 * Return the checkout URL for the given product.
 * It checks whether the user is connected to Jetpack.
 * It doesn't use Jetpack redirect because
 * there is an issue with the `redirect_to` param.
 *
 * @param {object}  props                 - props
 * @param {string}  props.product         - Checkout product name
 * @param {boolean} props.isUserConnected - True when the user is connected Jetpack
 * @param {string}  props.siteSuffix      - Site Calypso slug
 * @param {string}  props.redirectUrl     - Return URL after pruchase
 * @returns {string} the redirect URL
 */
export default function getProductCheckoutUrl( {
	product = 'jetpack_search',
	isUserConnected = true,
	siteSuffix,
	redirectUrl = '',
} ) {
	const checkoutUrl = new URL( 'https://wordpress.com/checkout/' );
	const checkoutProductUrl = new URL( `${ checkoutUrl }${ siteSuffix }/${ product }` );

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set( 'redirect_to', redirectUrl );

	// Add "unlinked" search parameter if site is not connected to Jetpack.
	if ( ! isUserConnected ) {
		checkoutProductUrl.searchParams.set( 'unlinked', 1 );
	}

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', siteSuffix );

	return checkoutProductUrl.toString();
}
