/**
 * Internal dependencies
 */
import { useReport } from './use-report';
import type { StatsReportParams, StatsReportQueryOptions } from '../queries/stats-query';

export type UseStatsOptions = {
	enabled?: boolean;
};

type StatsReportQueryFactory< TParams extends StatsReportParams > = (
	params: TParams
) => StatsReportQueryOptions;

export function useStatsReport< TParams extends StatsReportParams >(
	queryFactory: StatsReportQueryFactory< TParams >,
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
