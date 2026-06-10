/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportOrderAttributionSummary, fetchReportOrderAttributionByProduct } from '../api';
import {
	sanitizeReportOrderAttributionSummaryResponse,
	normalizeOrderAttributionByProductResponse,
	type SanitizedOrderAttributionSummaryResponse,
} from '../processing/order-attribution';
import { hasProductFilters } from '../utils/product-filters';
import type { FilterCondition } from '../types/filter-condition';
import type { UseQueryOptions } from '@tanstack/react-query';

type ReportOrderAttributionSummaryParams = Parameters<
	typeof fetchReportOrderAttributionSummary
>[ 0 ] & {
	filters?: FilterCondition[];
};

/**
 * Creates a query key for order attribution queries.
 *
 * Note: All comparison parameters are included in the query key because
 * order attribution returns both primary and comparison data in a single response.
 */
const getReportOrderAttributionQueryKey = ( params: ReportOrderAttributionSummaryParams ) =>
	[
		'reports',
		'order-attribution',
		params.view,
		params.from,
		params.to,
		params.interval,
		params.date_type,
		params.compare_from,
		params.compare_to,
		params.filters,
	] as const;

/**
 * React Query configuration for order attribution summary data.
 *
 * This query is designed to be used with `use-report` hook, which provides
 * standardized loading states and comparison handling.
 *
 * Important architectural notes:
 * - Unlike other report queries, order attribution includes comparison data in the
 *   PRIMARY response, not in a separate comparison query
 * - When used with `use-report`, the comparison query is disabled (it's a no-op)
 * - This query supports two API endpoints:
 *   1. Regular order-attribution API: Returns both periods in a single response
 *   2. By-product API: Fetches periods separately, then normalizes to match (1)
 *
 * @param params - Query parameters including date ranges and optional filters
 * @return React Query options with query key, fetch function, and enabled state
 */
export function reportOrderAttributionSummaryQuery(
	params: ReportOrderAttributionSummaryParams
): UseQueryOptions< SanitizedOrderAttributionSummaryResponse > {
	return {
		queryKey: getReportOrderAttributionQueryKey( params ),
		queryFn: async () => {
			const hasProductFiltersValue = hasProductFilters( params.filters );

			// Choose API based on whether product filters are present
			if ( hasProductFiltersValue ) {
				// By-product API path: Fetch primary and comparison periods in parallel
				const { compare_from, compare_to } = params;

				// Determine if we need to fetch comparison period
				const shouldFetchComparison =
					compare_from &&
					compare_to &&
					( compare_from !== params.from || compare_to !== params.to );

				// Fetch both periods in parallel for better performance
				const [ currentResponse, previousResponse ] = await Promise.all( [
					fetchReportOrderAttributionByProduct( {
						from: params.from,
						to: params.to,
						interval: params.interval,
						view: params.view,
						filters: params.filters,
						date_type: params.date_type,
					} ),
					shouldFetchComparison
						? fetchReportOrderAttributionByProduct( {
								from: compare_from,
								to: compare_to,
								interval: params.interval,
								view: params.view,
								filters: params.filters,
								date_type: params.date_type,
						  } )
						: Promise.resolve( undefined ),
				] );

				// Normalize to match the regular API structure (includes both periods)
				const normalizedResponse = normalizeOrderAttributionByProductResponse(
					currentResponse,
					previousResponse
				);

				return sanitizeReportOrderAttributionSummaryResponse( normalizedResponse );
			}

			// Regular API path: Returns both primary and comparison in one response
			const response = await fetchReportOrderAttributionSummary( params );
			return sanitizeReportOrderAttributionSummaryResponse( response );
		},

		/**
		 * Enable the query only when all required parameters are present.
		 * The 'view' parameter is required for order attribution queries.
		 */
		enabled: !! ( params.from && params.to && params.interval && params.view ),

		/**
		 * Keep previous data while fetching to prevent flash of empty state.
		 * This provides a smoother user experience during data refetching.
		 */
		placeholderData: previousData => previousData,
	};
}
