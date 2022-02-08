// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

/**
 * Return the checkout URL for the given product.
 * It checkes whether the user is connected to Jetpack.
 * It doesn't use Jetpack redirect because
 * it's not possible to pass a valid redirect_to parameter.
 * In short, and to make it work, it replaces the `=` character with `%3D`.
 *
 * @param {string} product          - Checkout product name
 * @param {boolean} isUserConnected - True when the user is connected Jetpack
 * @returns {string} the redirect URL
 */
export default function getProductCheckoutUrl( product, isUserConnected ) {
	const { siteSuffix, redirectUrl } = window?.myJetpackInitialState || {};
	const redirect_to = `${ redirectUrl.replace( /=/g, '%3d' ) }${
		! isUserConnected ? '&unlinked=1' : ''
	}&site=${ siteSuffix }`;
	return `https://wordpress.com/checkout/${ siteSuffix }/${ product }?redirect_to=${ redirect_to }`;
}
