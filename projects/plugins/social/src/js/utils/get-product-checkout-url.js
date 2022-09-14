/**
 * Return the checkout URL for the given product.
 *
 * @param {object}  props             - props
 * @param {string}  props.siteSuffix  - Site suffx.
 * @param {string}  props.product     - Checkout product name.
 * @param {string}  props.redirectUrl - Return URL after purchase.
 * @returns {string} The redirect URL.
 */
const getProductCheckoutUrl = ( {
	siteSuffix,
	product = 'jetpack_social_basic_yearly',
	redirectUrl = '',
} ) => {
	const url = new URL( `https://wordpress.com/checkout/jetpack/${ product }` );

	url.searchParams.set( 'redirect_to', redirectUrl );
	url.searchParams.set( 'site', siteSuffix );

	return url.toString();
};

export default getProductCheckoutUrl;
