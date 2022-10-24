import { useSelect } from '@wordpress/data';
import { useMemo } from 'react';
import { STORE_ID } from '../../state/store';

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useProtectData() {
	const { statusIsFetching, status, jetpackScan, productData } = useSelect( select => ( {
		statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
		status: select( STORE_ID ).getStatus(),
		jetpackScan: select( STORE_ID ).getJetpackScan(),
		productData: select( STORE_ID ).getProductData(),
	} ) );

	let currentStatus = 'error';
	if ( true === statusIsFetching ) {
		currentStatus = 'loading';
	} else if ( status.status ) {
		currentStatus = status.status;
	}

	const numCoreThreats = useMemo( () => status.core?.threat?.length || 0, [ status.core ] );

	const numPluginsThreats = useMemo(
		() =>
			( status.plugins || [] ).reduce( ( numThreats, plugin ) => {
				return numThreats + plugin.threats.length;
			}, 0 ),
		[ status.plugins ]
	);

	const numThemesThreats = useMemo(
		() =>
			( status.themes || [] ).reduce( ( numThreats, theme ) => {
				return numThreats + theme.threats.length;
			}, 0 ),
		[ status.themes ]
	);

	const numFilesThreats = useMemo( () => status.files?.length || 0, [ status.files ] );

	const numDatabaseThreats = useMemo( () => status.database?.length || 0, [ status.database ] );

	const numThreats =
		numCoreThreats + numPluginsThreats + numThemesThreats + numFilesThreats + numDatabaseThreats;

	return {
		numThreats,
		numCoreThreats,
		numPluginsThreats,
		numThemesThreats,
		numFilesThreats,
		numDatabaseThreats,
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
	};
}
