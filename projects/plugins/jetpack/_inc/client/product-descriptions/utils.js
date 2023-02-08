import { getSiteAdminUrl } from 'state/initial-state';
import { productDescriptionRoutes } from './constants';

/**
 * This affects search "Upgrade" buttons, and changes them into "Start for free".
 * It should use API to check if feature is enabled, but we didn't make it in time.
 *
 * Todo: Make it return true once we fully ship and enable new search pricing.
 *
 * @returns {boolean} Whether new search pricing and free plan is forced by URL parameter.
 */
export const isSearchNewPricingLaunched202208 = () =>
	URLSearchParams && !! new URLSearchParams( window.location?.search ).get( 'new_pricing_202208' );

/**
 * Get product description URL by product key.
 *
 * A product key differs from slugs since "jetpack-backup-daily" => "backups".
 * We follow these to keep support for existing redirects / tracks.
 *
 * @param {object} state - The site state
 * @param {string} productKey - Product key to redirect to.
 * @returns {string} URL for a product or the .
 */
export const getProductDescriptionUrl = ( state, productKey ) => {
	const baseUrl = `${ getSiteAdminUrl( state ) }admin.php?page=jetpack#`;

	// TODO: remove the && condition on Search new pricing launch.
	if ( productKey === 'search' ) {
		return `${ getSiteAdminUrl( state ) }admin.php?page=jetpack-search`;
	}

	if ( productDescriptionRoutes.includes( `/product/${ productKey }` ) ) {
		return `${ baseUrl }/product/${ productKey }`;
	}

	return `${ baseUrl }/dashboard`;
};
