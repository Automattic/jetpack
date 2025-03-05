import { getSiteAdminUrl } from 'state/initial-state';
import { productDescriptionRoutes, myJetpackRoutes } from './constants';

/**
 * Get product description URL by product key.
 *
 * A product key differs from slugs since "jetpack-backup-daily" => "backups".
 * We follow these to keep support for existing redirects / tracks.
 *
 * @param {object} state      - The site state
 * @param {string} productKey - Product key to redirect to.
 * @return {string} URL for a product or the .
 */
export const getProductDescriptionUrl = ( state, productKey ) => {
	const baseUrl = `${ getSiteAdminUrl( state ) }admin.php?page=jetpack#`;
	const myJetpackUrl = `${ getSiteAdminUrl( state ) }admin.php?page=my-jetpack#`;

	if ( productKey === 'search' ) {
		return `${ getSiteAdminUrl( state ) }admin.php?page=jetpack-search`;
	}

	if ( myJetpackRoutes.includes( `/add-${ productKey }` ) ) {
		return `${ myJetpackUrl }/add-${ productKey }`;
	}

	if ( productDescriptionRoutes.includes( `/product/${ productKey }` ) ) {
		return `${ baseUrl }/product/${ productKey }`;
	}

	return `${ baseUrl }/dashboard`;
};
