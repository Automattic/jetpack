import { type ExtensionStatus, type Threat, type ThreatStatus } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import useHistoryQuery from '../../data/scan/use-history-query';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useProductDataQuery from '../../data/use-product-data-query';

type ThreatFilterKey = 'all' | 'core' | 'files' | 'database' | string;

type Filter = { key: ThreatFilterKey; status: ThreatStatus | 'all' };

// Valid "key" values for filtering.
const KEY_FILTERS = [ 'all', 'core', 'plugins', 'themes', 'files', 'database' ];

/**
 * Filter Extension Threats
 *
 * @param {Array}  threats       - The threats to filter.
 * @param {object} filter        - The filter to apply to the data.
 * @param {string} filter.status - The status to filter: 'all', 'current', 'fixed', or 'ignored'.
 * @param {string} filter.key    - The key to filter: 'all', 'core', 'files', 'database', or an extension name.
 * @param {string} key           - The threat's key: 'all', 'core', 'files', 'database', or an extension name.
 *
 * @return {Array} The filtered threats.
 */
const filterThreats = ( threats: Threat[], filter: Filter, key: ThreatFilterKey ): Threat[] => {
	if ( ! Array.isArray( threats ) ) {
		return [];
	}

	return threats.filter( threat => {
		if ( filter.status && filter.status !== 'all' && threat.status !== filter.status ) {
			return false;
		}
		if ( filter.key && filter.key !== 'all' && filter.key !== key ) {
			return false;
		}
		return true;
	} );
};

/**
 * Get parsed data from the initial state
 *
 * @param {object} options            - The options to use when getting the data.
 * @param {string} options.sourceType - 'scan' or 'history'.
 * @param {object} options.filter     - The filter to apply to the data.
 *                                    _param {string} options.filter.status - 'all', 'fixed', or 'ignored'.
 *                                    _param {string} options.filter.key    - 'all', 'core', 'files', 'database', or an extension name.
 *
 * @return {object} The information available in Protect's initial state.
 */
export default function useProtectData(
	{ sourceType, filter } = {
		sourceType: 'scan',
		filter: { status: null, key: null },
	}
) {
	const { data: status } = useScanStatusQuery();
	const { data: scanHistory } = useHistoryQuery();
	const { data: jetpackScan } = useProductDataQuery();

	const { counts, results, error, lastChecked, hasUncheckedItems } = useMemo( () => {
		// This hook can provide data from two sources: the current scan or the scan history.
		const data = sourceType === 'history' ? { ...scanHistory } : { ...status };

		// Prepare the result object.
		const result = {
			results: {
				core: [],
				plugins: [],
				themes: [],
				files: [],
				database: [],
			},
			counts: {
				all: {
					threats: 0,
					core: 0,
					plugins: 0,
					themes: 0,
					files: 0,
					database: 0,
				},
				current: {
					threats: 0,
					core: 0,
					plugins: 0,
					themes: 0,
					files: 0,
					database: 0,
				},
			},
			error: null,
			lastChecked: data.lastChecked || null,
			hasUncheckedItems: data.hasUncheckedItems || false,
		};

		// Loop through the provided extensions, and update the result object.
		const processExtensions = ( extensions: Array< ExtensionStatus >, key: ThreatFilterKey ) => {
			if ( ! Array.isArray( extensions ) ) {
				return [];
			}
			extensions.forEach( extension => {
				// Update the total counts.
				result.counts.all[ key ] += extension?.threats?.length || 0;
				result.counts.all.threats += extension?.threats?.length || 0;

				// Filter the extension's threats based on the current filters.
				const filteredThreats = filterThreats(
					extension?.threats || [],
					filter,
					KEY_FILTERS.includes( filter.key ) ? key : extension?.name
				);

				// Update the result object with the extension and its filtered threats.
				result.results[ key ].push( { ...extension, threats: filteredThreats } );

				// Update the current counts.
				result.counts.current[ key ] += filteredThreats.length;
				result.counts.current.threats += filteredThreats.length;
			} );
		};

		// Loop through the provided threats, and update the result object.
		const processThreats = ( threatsToProcess: Threat[], key: ThreatFilterKey ) => {
			if ( ! Array.isArray( threatsToProcess ) ) {
				return [];
			}

			result.counts.all[ key ] += threatsToProcess.length;
			result.counts.all.threats += threatsToProcess.length;

			const filteredThreats = filterThreats( threatsToProcess, filter, key );

			result.results[ key ] = [ ...result.results[ key ], ...filteredThreats ];
			result.counts.current[ key ] += filteredThreats.length;
			result.counts.current.threats += filteredThreats.length;
		};

		// Core data may be either a single object or an array of multiple objects.
		let cores = Array.isArray( data.core ) ? data.core : [];
		if ( data?.core?.threats ) {
			cores = [ data.core ];
		}

		// Process the data
		processExtensions( cores, 'core' );
		processExtensions( data?.plugins, 'plugins' );
		processExtensions( data?.themes, 'themes' );
		processThreats( data?.files, 'files' );
		processThreats( data?.database, 'database' );

		// Handle errors
		if ( data.error ) {
			result.error = {
				message: data.errorMessage || __( 'An error occurred.', 'jetpack-protect' ),
				code: data.errorCode || 500,
			};
		}

		return result;
	}, [ scanHistory, sourceType, status, filter ] );

	return {
		results,
		counts,
		error,
		lastChecked,
		hasUncheckedItems,
		jetpackScan,
	};
}
