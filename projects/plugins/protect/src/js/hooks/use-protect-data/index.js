import { useSelect } from '@wordpress/data';
import { useMemo } from 'react';
import { STORE_ID } from '../../state/store';
import useScanHistory from '../use-scan-history';

/**
 * Get parsed data from the initial state
 *
 * @param {object} options - The options to use when getting the data.
 * @param {string} options.sourceType - 'scan' or 'history'.
 * @param {string} options.statusFilter - 'all', 'fixed', or 'ignored'.
 * @returns {object} The information available in Protect's initial state.
 */
export default function useProtectData( { sourceType = 'scan', statusFilter = 'all' } = {} ) {
	const { status, scanHistory, jetpackScan, hasRequiredPlan } = useSelect( select => ( {
		status: select( STORE_ID ).getStatus(),
		scanHistory: select( STORE_ID ).getScanHistory(),
		jetpackScan: select( STORE_ID ).getJetpackScan(),
		hasRequiredPlan: select( STORE_ID ).hasRequiredPlan(),
	} ) );

	const source = useMemo( () => {
		const data = sourceType === 'history' ? { ...scanHistory } : { ...status };

		// Filter the threats based on the status filter.
		if ( statusFilter === 'all' ) {
			return data;
		}

		return {
			core: ( data.core || [] )
				.map( core => {
					const threats = core.threats.filter( threat => threat.status === statusFilter );
					return { ...core, threats };
				} )
				.filter( core => core.threats.length > 0 ),
			plugins: ( data.plugins || [] ).reduce( ( acc, plugin ) => {
				const threats = plugin.threats.filter( threat => threat.status === statusFilter );
				if ( threats.length > 0 ) {
					acc.push( { ...plugin, threats } );
				}
				return acc;
			}, [] ),
			themes: ( data.themes || [] ).reduce( ( acc, theme ) => {
				const threats = theme.threats.filter( threat => threat.status === statusFilter );
				if ( threats.length > 0 ) {
					acc.push( { ...theme, threats } );
				}
				return acc;
			}, [] ),
			files: ( data.files || [] ).filter( threat => threat.status === statusFilter ),
			database: ( data.database || [] ).filter( threat => threat.status === statusFilter ),
		};
	}, [ sourceType, status, scanHistory, statusFilter ] );

	const numCoreThreats = useMemo( () => {
		if ( 'history' === sourceType ) {
			return ( source.core || [] ).reduce(
				( numThreats, core ) => numThreats + core.threats.length,
				0
			);
		}
		return source.core?.threats?.length || 0;
	}, [ sourceType, source.core ] );

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
