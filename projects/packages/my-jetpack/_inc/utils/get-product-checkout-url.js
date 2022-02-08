// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { MY_JETPACK_PRODUCT_CHECKOUT } from '../constants';

/**
 * Return the product redirect URL, according to
 * the Jetpack redirect source, site, path, and redirect_to params.
 *
 * @param {string} product          - Checkout product name
 * @param {boolean} isUserConnected - True when the user is connected Jetpack
 * @returns {string} the redirect URL
 */
export default function getProductCheckoutUrl( product, isUserConnected ) {
	const { siteSuffix: site, redirectUrl } = window?.myJetpackInitialState || {};
	const redirect_to = `${ redirectUrl }&product=${ product }`;
	const unlinked = ! isUserConnected ? '&unlinked=1' : '';

	return getRedirectUrl( MY_JETPACK_PRODUCT_CHECKOUT, {
		site,
		path: 'jetpack_search',
		query: `redirect_to=${ redirect_to }${ unlinked }`,
	} );
}
