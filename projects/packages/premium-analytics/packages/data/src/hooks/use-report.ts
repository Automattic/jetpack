/**
 * External dependencies
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { resolveReportTimeZone, type ReportTimeZoneParams } from '../utils/report-timezone';
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
 */
export function useReport<
	TData,
	TParams extends ReportParams & ReportTimeZoneParams = ReportParams,
>( queryFactory: QueryFactory< TData >, params: TParams, options?: UseReportOptions ) {
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

	// Only the conversion funnel adds `steps`, so all three shapes are checked.
	// `as any` escapes `TData`, unconstrainable without breaking callers.
	const hasData =
		Boolean( ( primary.data as any )?.summary ) ||
		Boolean( ( primary.data as any )?.data?.length ) ||
		Boolean( ( primary.data as any )?.steps?.length ) ||
		Boolean( ( comparison.data as any )?.summary ) ||
		Boolean( ( comparison.data as any )?.data?.length ) ||
		Boolean( ( comparison.data as any )?.steps?.length );

	// React Query's `refetch()` deliberately ignores `enabled`, so the gate is
	// re-applied here to leave a switched-off query alone.
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
		// The zone both queries were built and normalized under, so a consumer
		// reads the report it has rather than asking the environment again.
		timezone: resolveReportTimeZone( params.timezone ),
		isLoading,
		isFetching,
		hasData,
		isError: primary.isError || comparison.isError,
		error: primary.error ?? comparison.error,
		refetch,
	};
}
