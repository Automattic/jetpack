/**
 * Internal dependencies
 */
import { useReport } from './use-report';
import type { statsTopPostsQuery } from '../queries/stats-top-posts-query';
import type { StatsReportParams } from '../queries/stats-query';

export type UseStatsOptions = {
	enabled?: boolean;
};

type StatsReportQueryFactory = (
	params: StatsReportParams
) => ReturnType< typeof statsTopPostsQuery >;

export function useStatsReport(
	queryFactory: StatsReportQueryFactory,
	params: StatsReportParams,
	disabledComparisonKey: string[],
	options?: UseStatsOptions
) {
	return useReport( p => queryFactory( p as StatsReportParams ), params, {
		enabled: options?.enabled,
		disabledComparisonKey,
	} );
}
