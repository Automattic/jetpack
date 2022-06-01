import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Return the URL of the checkout page with a given product in cart, for a specific site.
 *
 * @param {string} productSlug - Slug of the product to order
 * @param {string} siteAdminUrl - Site admin URL
 * @param {string} siteRawUrl - Site URL
 * @param {string} couponCode - Coupon code
 * @returns {string} Checkout URL
 */
export const generateCheckoutLink = ( productSlug, siteAdminUrl, siteRawUrl, couponCode ) => {
	return getRedirectUrl( 'jetpack-recommendations-product-checkout', {
		site: siteRawUrl,
		path: productSlug,
		query: `coupon=${
			couponCode || ''
		}&redirect_to=${ siteAdminUrl }admin.php?jp-react-redirect=product-purchased`,
	} );
};
