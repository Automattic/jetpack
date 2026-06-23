/**
 * Internal dependencies
 */
import { useReport } from './use-report';
import type { StatsReportParams, StatsReportQueryOptions } from '../queries/stats-query';

export type UseStatsOptions = {
	enabled?: boolean;
};

type StatsReportQueryFactory = ( params: StatsReportParams ) => StatsReportQueryOptions;

export function useStatsReport(
	queryFactory: StatsReportQueryFactory,
	params: StatsReportParams,
	reportSlug: string,
	options?: UseStatsOptions
) {
	return useReport( p => queryFactory( p as StatsReportParams ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'stats', reportSlug, '__comparison__', 'disabled' ],
	} );
}
