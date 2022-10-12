import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useProtectData() {
	const { statusIsFetching, status, jetpackScan, productData, credentialState } = useSelect(
		select => ( {
			statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
			status: select( STORE_ID ).getStatus(),
			jetpackScan: select( STORE_ID ).getJetpackScan(),
			productData: select( STORE_ID ).getProductData(),
			credentialState: select( STORE_ID ).getCredentialState(),
		} )
	);

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
		numFilesThreats: status.files?.length || 0,
		numDatabaseThreats: status.database?.length || 0,
		lastChecked: status.lastChecked || null,
		errorCode: status.errorCode || null,
		errorMessage: status.errorMessage || null,
		core: status.core || {},
		plugins: status.plugins || [],
		themes: status.themes || [],
		files: { threats: status.files || [] },
		database: { threats: status.database || [] },
		currentStatus,
		hasUncheckedItems: status.hasUncheckedItems,
		jetpackScan,
		productData,
		credentialState,
	};
}
