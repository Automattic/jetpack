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

	const hasUncheckedItems = [
		...( status.themes || [] ),
		...( status.plugins || [] ),
		status.core || {},
	].some( item => item.not_checked );

	return {
		numVulnerabilities: status.numVulnerabilities || 0,
		numCoreVulnerabilities: status.core?.vulnerabilities?.length || 0,
		numPluginsVulnerabilities: status.numPluginsVulnerabilities || 0,
		numThemesVulnerabilities: status.numThemesVulnerabilities || 0,
		lastChecked: status.lastChecked || null,
		errorCode: status.errorCode || null,
		errorMessage: status.errorMessage || null,
		core: status.core || {},
		plugins: status.plugins || [],
		themes: status.themes || [],
		currentStatus,
		hasUncheckedItems,
		securityBundle,
		productData,
	};
}
