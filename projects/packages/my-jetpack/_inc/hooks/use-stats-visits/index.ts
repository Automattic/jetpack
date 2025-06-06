import { useCallback, useMemo } from 'react';
import { QUERY_STATS_VISITS_KEY, getStatsVisitsEndpoint } from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';

interface StatsVisitsData {
	date: string;
	unit: string;
	fields: string[];
	data: Array< [ string, number, number, number, number ] >; // [period, views, visitors, likes, comments]
}

interface StatsVisitsOptions {
	period?: 'day' | 'week' | 'month' | 'year';
	quantity?: number;
	enabled?: boolean;
}

/**
 * Hook for fetching stats visits data from Odyssey Stats API
 * Following the same pattern as Odyssey Stats use-visits-query
 *
 * @param {string}             blogID    - The ID of the site to fetch stats for
 * @param {boolean}            isEnabled - Whether the query should be enabled
 * @param {StatsVisitsOptions} options   - Configuration options for the query
 * @return {object} Query result containing stats visits data and loading state
 */
const useStatsVisits = ( blogID: string, isEnabled: boolean, options: StatsVisitsOptions = {} ) => {
	const { period = 'day', quantity = 7 } = options;

	// Build query parameters like Odyssey Stats does
	const queryParams = useMemo( () => {
		const params = new URLSearchParams();

		params.set( 'unit', period );
		params.set( 'quantity', quantity.toString() );
		params.set( 'stat_fields', [ 'visitors', 'views', 'likes', 'comments' ].join( ',' ) );

		return params.toString();
	}, [ period, quantity ] );

	// Construct the full endpoint with query parameters
	const endpoint = useCallback( () => {
		if ( ! blogID ) {
			return '';
		}
		const baseEndpoint = getStatsVisitsEndpoint( blogID );
		return `${ baseEndpoint }?${ queryParams }`;
	}, [ blogID, queryParams ] );

	const { data, isLoading, error } = useSimpleQuery< StatsVisitsData >( {
		name: QUERY_STATS_VISITS_KEY,
		query: { path: endpoint() },
		options: {
			enabled: isEnabled,
		},
	} );

	return {
		data,
		isLoading,
		error,
	};
};

export default useStatsVisits;
