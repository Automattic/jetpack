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
	date?: Date;
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
	const { period = 'day', quantity = 7, date } = options;

	// Build query parameters like Odyssey Stats does
	const queryParams = useMemo( () => {
		const params = new URLSearchParams();

		params.set( 'unit', period );
		params.set( 'quantity', quantity.toString() );
		params.set( 'stat_fields', [ 'visitors', 'views', 'likes', 'comments' ].join( ',' ) );

		// Add date parameter if provided
		if ( date ) {
			const endDate = new Date( date );
			const startDate = new Date( date );
			startDate.setDate( startDate.getDate() - quantity + 1 ); // +1 because we want to exclude the present day

			// Format dates as YYYY-MM-DD
			const formatDate = ( dateToFormat: Date ) => {
				const year = dateToFormat.getFullYear();
				const month = String( dateToFormat.getMonth() + 1 ).padStart( 2, '0' );
				const day = String( dateToFormat.getDate() ).padStart( 2, '0' );
				return `${ year }-${ month }-${ day }`;
			};

			params.set( 'date', formatDate( endDate ) );
			params.set( 'start_date', formatDate( startDate ) );
		}

		return params.toString();
	}, [ period, quantity, date ] );

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
			gcTime: 5000,
			refetchOnMount: 'always',
		},
	} );

	return {
		data,
		isLoading,
		error,
	};
};

export default useStatsVisits;
