import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useProtectData() {
	const { statusIsFetching, status, securityBundle, productData } = useSelect( select => ( {
		statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
		status: select( STORE_ID ).getStatus(),
		securityBundle: select( STORE_ID ).getSecurityBundle(),
		productData: select( STORE_ID ).getProductData(),
	} ) );

	let currentStatus = 'error';
	if ( true === statusIsFetching ) {
		currentStatus = 'loading';
	} else if ( status.status ) {
		currentStatus = status.status;
	}

	return {
		numThreats: status.numThreats || 0,
		numCoreThreats: status.core?.threats?.length || 0,
		numPluginsThreats: status.numPluginsThreats || 0,
		numThemesThreats: status.numThemesThreats || 0,
		lastChecked: status.lastChecked || null,
		errorCode: status.errorCode || null,
		errorMessage: status.errorMessage || null,
		core: status.core || {},
		plugins: status.plugins || [],
		themes: status.themes || [],
		currentStatus,
		hasUncheckedItems: status.hasUncheckedItems,
		securityBundle,
		productData,
	};
}
