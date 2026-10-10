import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteAdminUrl, getSiteRawUrl, showMyJetpack } from 'state/initial-state';
import { myJetpackRoutes } from './constants';

/**
 * This affects search "Upgrade" buttons, and changes them into "Start for free".
 * It should use API to check if feature is enabled, but we didn't make it in time.
 *
 * Todo: Make it return true once we fully ship and enable new search pricing.
 *
 * @return {boolean} Whether new search pricing and free plan is forced by URL parameter.
 */
export const isSearchNewPricingLaunched202208 = () =>
	URLSearchParams && !! new URLSearchParams( window.location?.search ).get( 'new_pricing_202208' );

/**
 * Get product description URL by product key.
 *
 * A product key differs from slugs since "jetpack-backup-daily" => "backups".
 * We follow these to keep support for existing redirects / tracks.
 *
 * @param {object} state      - The site state
 * @param {string} productKey - Product key to redirect to.
 * @return {string} URL for the product's upgrade flow.
 */
export const getProductDescriptionUrl = ( state, productKey ) => {
	const adminUrl = getSiteAdminUrl( state );

	// TODO: remove the && condition on Search new pricing launch.
	if ( productKey === 'search' ) {
		return `${ adminUrl }admin.php?page=jetpack-search`;
	}

	// Where My Jetpack is off (offline, VIP, non-classic WoA), its page isn't registered.
	if ( ! showMyJetpack( state ) ) {
		return getRedirectUrl( 'jetpack-plans', { site: getSiteRawUrl( state ) } );
	}

	const myJetpackUrl = `${ adminUrl }admin.php?page=my-jetpack`;

	if ( myJetpackRoutes.includes( `/add-${ productKey }` ) ) {
		return `${ myJetpackUrl }#/add-${ productKey }`;
	}

	return myJetpackUrl;
};
