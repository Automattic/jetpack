/**
 * External dependencies
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { hasComparisonEnabled, type ReportParams } from '../utils/search';
import { isAwaitingData } from './awaiting-data';
import { REFRESH_NOTICE_META } from './refresh-failure-scope';

type UseReportOptions = {
	enabled?: boolean;
	disabledComparisonKey?: string[];
};

type QueryFactory< TData > = (
	params: any,
	queryType: 'primary' | 'comparison'
) => UseQueryOptions< TData >;

/**
 * Generic hook for fetching report data with comparison support. The comparison
 * query is driven by the comparison dates in `params`; when it is disabled the
 * query still mounts, parked on `options.disabledComparisonKey`.
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

	const primaryQueryOptions = queryFactory( primaryParams, 'primary' );

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

	const primaryEnabled = queryEnabled && ( primaryQueryOptions.enabled ?? true );
	const comparisonQueryEnabled =
		queryEnabled && comparisonEnabled && ( comparisonQueryOptions.enabled ?? true );

	const primary = useQuery( {
		...primaryQueryOptions,
		enabled: primaryEnabled,
		meta: { ...primaryQueryOptions.meta, ...REFRESH_NOTICE_META },
	} );

	const comparison = useQuery( {
		...comparisonQueryOptions,
		enabled: comparisonQueryEnabled,
		meta: { ...comparisonQueryOptions.meta, ...REFRESH_NOTICE_META },
	} );

	// Widened past React Query's `isLoading` — see `isAwaitingData`. Its own
	// flags stay reachable through `primary` and `comparison`.
	const isLoading = isAwaitingData( primary ) || isAwaitingData( comparison );
	const isFetching = primary.isFetching || comparison.isFetching;

	/**
	 * Sanitized report responses always carry `summary` and `data`; only the
	 * conversion funnel adds `steps`, so all three are checked. The `as any`
	 * escapes the generic `TData`, which cannot be constrained without breaking
	 * existing callers.
	 */
	const hasData =
		Boolean( ( primary.data as any )?.summary ) ||
		Boolean( ( primary.data as any )?.data?.length ) ||
		Boolean( ( primary.data as any )?.steps?.length ) ||
		Boolean( ( comparison.data as any )?.summary ) ||
		Boolean( ( comparison.data as any )?.data?.length ) ||
		Boolean( ( comparison.data as any )?.steps?.length );

	// Combined refetch: memoized and awaiting both queries, so one "Retry" can
	// re-run everything the widget asked for. React Query's own `refetch()`
	// deliberately ignores `enabled`, so the gate is applied here instead — a
	// switched-off query is left alone, and widgets passing `enabled` need no
	// guard of their own around the retry action.
	const primaryRefetch = primary.refetch;
	const comparisonRefetch = comparison.refetch;
	const refetch = useCallback( async () => {
		await Promise.all( [
			primaryEnabled ? primaryRefetch() : Promise.resolve(),
			comparisonQueryEnabled ? comparisonRefetch() : Promise.resolve(),
		] );
	}, [ primaryEnabled, comparisonQueryEnabled, primaryRefetch, comparisonRefetch ] );

	return {
		primary,
		comparison,
		hasComparison: comparisonEnabled,
		isLoading,
		isFetching,
		hasData,
		isError: primary.isError || comparison.isError,
		error: primary.error ?? comparison.error,
		refetch,
	};
}
