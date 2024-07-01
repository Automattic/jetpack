import { useSelect } from '@wordpress/data';
import { useMemo } from 'react';
import { STORE_ID } from '../../state/store';

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useProtectData() {
	const { status, jetpackScan, hasRequiredPlan } = useSelect( select => ( {
		status: select( STORE_ID ).getStatus(),
		jetpackScan: select( STORE_ID ).getJetpackScan(),
		hasRequiredPlan: select( STORE_ID ).hasRequiredPlan(),
	} ) );

	const numCoreThreats = useMemo( () => {
		return status.core?.threats?.length || 0;
	}, [ status.core ] );

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
		error: status.error || false,
		errorCode: status.errorCode || null,
		errorMessage: status.errorMessage || null,
		core: status.core || {},
		plugins: status.plugins || [],
		themes: status.themes || [],
		files: { threats: status.files || [] },
		database: { threats: status.database || [] },
		hasUncheckedItems: status.hasUncheckedItems,
		jetpackScan,
		hasRequiredPlan,
	};
}
