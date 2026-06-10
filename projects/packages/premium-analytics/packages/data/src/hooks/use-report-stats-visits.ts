/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { fetchReportStatsVisits } from '../api/report-stats-visits-fetch';
import { sanitizeReportStatsVisitsResponse } from '../processing/stats-visits';
import type { RequestReportStatsVisitsParams } from '../api/report-stats-visits-fetch';

export type UseReportStatsVisitsParams = RequestReportStatsVisitsParams;

type UseReportStatsVisitsOptions = {
	enabled?: boolean;
};

/**
 * Fetch visit counts (views, visitors, …) over time for the site.
 *
 * Unlike the WooCommerce report hooks this uses `useQuery` directly — stats
 * has no comparison-period concept in v1, so `useReport` does not apply.
 *
 * @param params  - Report parameters.
 * @param options - Optional configuration.
 * @return The react-query result fields plus the sanitized time-series `data`.
 */
export function useReportStatsVisits(
	params: UseReportStatsVisitsParams,
	options?: UseReportStatsVisitsOptions
) {
	const { unit, quantity, date, statFields } = params;

	const query = useQuery( {
		queryKey: [ 'stats', 'visits', unit, quantity, date ?? null, statFields ],
		queryFn: async () =>
			sanitizeReportStatsVisitsResponse(
				await fetchReportStatsVisits( { unit, quantity, date, statFields } )
			),
		enabled: options?.enabled ?? true,
		placeholderData: previousData => previousData,
	} );

	return {
		data: query.data,
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
