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
 * The comparison parameters belong in the query key: order attribution returns both
 * primary and comparison data in a single response.
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
 * Unlike other report queries, order attribution includes comparison data in the
 * PRIMARY response, so `use-report`'s comparison query is a disabled no-op here.
 *
 * Two API endpoints back this:
 * 1. Regular order-attribution API: returns both periods in a single response.
 * 2. By-product API: fetches the periods separately, then normalizes to match (1).
 */
export function reportOrderAttributionSummaryQuery(
	params: ReportOrderAttributionSummaryParams
): UseQueryOptions< SanitizedOrderAttributionSummaryResponse > {
	return {
		queryKey: getReportOrderAttributionQueryKey( params ),
		queryFn: async () => {
			const hasProductFiltersValue = hasProductFilters( params.filters );

			if ( hasProductFiltersValue ) {
				// By-product API path: the comparison period is a second request.
				const { compare_from, compare_to } = params;

				const shouldFetchComparison =
					compare_from &&
					compare_to &&
					( compare_from !== params.from || compare_to !== params.to );

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

				// Normalize to the regular API's shape, which nests both periods.
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

		// `view` is required by the order attribution endpoints.
		enabled: !! ( params.from && params.to && params.interval && params.view ),

		placeholderData: previousData => previousData,
	};
}
