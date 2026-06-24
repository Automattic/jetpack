/**
 * Internal dependencies
 */
import { useReport } from './use-report';
import type { StatsReportParams } from '../queries/stats-query';
import type { UseQueryOptions } from '@tanstack/react-query';

export type UseStatsOptions = {
	enabled?: boolean;
};

type StatsReportQueryFactory< TParams extends StatsReportParams, TData > = (
	params: TParams
) => UseQueryOptions< TData >;

export function useStatsReport< TParams extends StatsReportParams, TData >(
	queryFactory: StatsReportQueryFactory< TParams, TData >,
	params: TParams,
	reportSlugOrDisabledComparisonKey: string | string[],
	options?: UseStatsOptions
) {
	const disabledComparisonKey = Array.isArray( reportSlugOrDisabledComparisonKey )
		? reportSlugOrDisabledComparisonKey
		: [ 'stats', reportSlugOrDisabledComparisonKey, '__comparison__', 'disabled' ];

	return useReport( p => queryFactory( p as TParams ), params, {
		enabled: options?.enabled,
		disabledComparisonKey,
	} );
}
