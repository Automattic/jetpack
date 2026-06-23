/**
 * External dependencies
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { hasComparisonEnabled, type ReportParams } from '../utils/search';

type UseReportOptions = {
	enabled?: boolean;
	disabledComparisonKey?: string[];
};

type QueryFactory< TData > = (
	params: any,
	queryType: 'primary' | 'comparison'
) => UseQueryOptions< TData >;

/**
 * Generic hook for fetching report data with comparison support.
 *
 * This hook handles the common pattern of fetching primary and comparison
 * data for analytics reports. It automatically manages the comparison query
 * based on the presence of comparison dates in the params.
 *
 * @template TData - The type of data returned by the query
 *
 * @param    queryFactory                  - Function that creates a query options object from params
 * @param    params                        - Report parameters including dates, filters, and comparison dates
 * @param    options                       - Optional configuration
 * @param    options.enabled               - Whether the queries should be enabled (default: true)
 * @param    options.disabledComparisonKey - Query key to use when comparison is disabled
 *
 * @return Object containing primary and comparison query results
 *
 * @example
 * ```typescript
 * const { primary, comparison, hasComparison, isLoading, hasData } = useReport(
 *   (params) => reportOrdersQuery(params, hasProductFilters),
 *   reportParams,
 *   {
 *     enabled: true,
 *     disabledComparisonKey: ['reports', 'orders', '__comparison__', 'disabled'],
 *   }
 * );
 * ```
 */
export function useReport< TData, TParams extends ReportParams = ReportParams >(
	queryFactory: QueryFactory< TData >,
	params: TParams,
	options?: UseReportOptions
) {
	const queryEnabled = options?.enabled ?? true;
	const comparisonEnabled = hasComparisonEnabled( params );
	const primaryParams = { ...params };
	delete primaryParams.compare_from;
	delete primaryParams.compare_to;
	delete primaryParams.compare_preset;
	delete primaryParams.comp;

	// Create primary query
	const primaryQueryOptions = queryFactory( primaryParams, 'primary' );

	// Create comparison query if comparison is enabled
	const comparisonQueryOptions = comparisonEnabled
		? queryFactory(
				{
					...primaryParams,
					from: params.compare_from,
					to: params.compare_to,
				},
				'comparison'
		  )
		: {
				queryKey: options?.disabledComparisonKey ?? [ 'reports', '__comparison__', 'disabled' ],
		  };

	const primary = useQuery( {
		...primaryQueryOptions,
		enabled: queryEnabled && ( primaryQueryOptions.enabled ?? true ),
	} );

	const comparison = useQuery( {
		...comparisonQueryOptions,
		enabled: queryEnabled && comparisonEnabled && ( comparisonQueryOptions.enabled ?? true ),
	} );

	// Compute common derived states
	const isLoading = primary.isLoading || comparison.isLoading;
	const isFetching = primary.isFetching || comparison.isFetching;

	/**
	 * Check if data exists using standardized response fields.
	 *
	 * All sanitized report responses follow a consistent structure:
	 * - `summary`: Always present (aggregated metrics)
	 * - `data`: Array of time-series or items (orders, bookings, products, etc.)
	 * - `steps`: Array of funnel steps (conversion-rate only)
	 *
	 * We check multiple fields because different endpoints return different combinations:
	 * - Time-series reports (orders, bookings, visitors): { summary, data }
	 * - Conversion funnel: { summary, data, steps, overallRate }
	 * - List reports (products, coupons): { summary, data }
	 *
	 * The use of `as any` is intentional here to handle the generic TData type,
	 * since we cannot add constraints to the generic without breaking existing usage.
	 *
	 * Note: With placeholderData enabled in queries, this hasData check is sufficient
	 * to determine loading states:
	 * - If hasData is true: We have data to display (show with loading indicator if fetching)
	 * - If hasData is false: No data to display (show skeleton)
	 */
	const hasData =
		Boolean( ( primary.data as any )?.summary ) ||
		Boolean( ( primary.data as any )?.data?.length ) ||
		Boolean( ( primary.data as any )?.steps?.length ) ||
		Boolean( ( comparison.data as any )?.summary ) ||
		Boolean( ( comparison.data as any )?.data?.length ) ||
		Boolean( ( comparison.data as any )?.steps?.length );

	// Combined refetch function that refetches both queries.
	// If both primary and comparison queries fail, clicking "Retry" should refetch both.
	const primaryRefetch = primary.refetch;
	const comparisonRefetch = comparison.refetch;
	const refetch = useCallback( async () => {
		await Promise.all( [
			primaryRefetch(),
			comparisonEnabled ? comparisonRefetch() : Promise.resolve(),
		] );
	}, [ comparisonEnabled, primaryRefetch, comparisonRefetch ] );

	return {
		primary,
		comparison,
		hasComparison: comparisonEnabled,
		isLoading,
		isFetching,
		hasData,
		// Error handling
		isError: primary.isError || comparison.isError,
		error: primary.error ?? comparison.error,
		refetch,
	};
}
