import { getSiteAdminUrl } from 'state/initial-state';
import { productDescriptionRoutes } from './constants';

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
	if ( productKey === 'search' && isSearchNewPricingLaunched202208() ) {
		return `${ getSiteAdminUrl( state ) }admin.php?page=jetpack-search`;
	}

	if ( productDescriptionRoutes.includes( `/product/${ productKey }` ) ) {
		return `${ baseUrl }/product/${ productKey }`;
	}

	return `${ baseUrl }/dashboard`;
};
