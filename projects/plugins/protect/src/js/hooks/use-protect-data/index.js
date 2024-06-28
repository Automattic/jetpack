import { useSelect } from '@wordpress/data';
import { useMemo } from 'react';
import { STORE_ID } from '../../state/store';
import useScanHistory from '../use-scan-history';

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useProtectData() {
	const { viewingScanHistory, scanHistory } = useScanHistory();

	const { status, jetpackScan, hasRequiredPlan } = useSelect( select => ( {
		status: select( STORE_ID ).getStatus(),
		jetpackScan: select( STORE_ID ).getJetpackScan(),
		hasRequiredPlan: select( STORE_ID ).hasRequiredPlan(),
	} ) );

	const source = viewingScanHistory ? scanHistory : status;

	const numCoreThreats = useMemo( () => {
		if ( viewingScanHistory ) {
			return ( source.core || [] ).reduce(
				( numThreats, core ) => numThreats + core.threats.length,
				0
			);
		}
		return source.core?.threats?.length || 0;
	}, [ viewingScanHistory, source.core ] );

	const numPluginsThreats = useMemo(
		() =>
			( source.plugins || [] ).reduce( ( numThreats, plugin ) => {
				return numThreats + plugin.threats.length;
			}, 0 ),
		[ source.plugins ]
	);

	const numThemesThreats = useMemo(
		() =>
			( source.themes || [] ).reduce( ( numThreats, theme ) => {
				return numThreats + theme.threats.length;
			}, 0 ),
		[ source.themes ]
	);

	const numFilesThreats = useMemo( () => source.files?.length || 0, [ source.files ] );

	const numDatabaseThreats = useMemo( () => source.database?.length || 0, [ source.database ] );

	const numThreats =
		numCoreThreats + numPluginsThreats + numThemesThreats + numFilesThreats + numDatabaseThreats;

	return {
		numThreats,
		numCoreThreats,
		numPluginsThreats,
		numThemesThreats,
		numFilesThreats,
		numDatabaseThreats,
		lastChecked: source.lastChecked || null,
		error: source.error || false,
		errorCode: source.errorCode || null,
		errorMessage: source.errorMessage || null,
		core: source.core || {},
		plugins: source.plugins || [],
		themes: source.themes || [],
		files: { threats: source.files || [] },
		database: { threats: source.database || [] },
		hasUncheckedItems: source.hasUncheckedItems,
		jetpackScan,
		hasRequiredPlan,
	};
}
