/**
 * Internal dependencies
 */
import { useReport } from './use-report';
import type { StatsReportParams } from '../queries/stats-query';
import type { UseQueryOptions } from '@tanstack/react-query';

export type UseStatsOptions = {
	enabled?: boolean;
};

type StatsReportQueryFactory< TParams extends StatsReportParams > = (
	params: TParams
) => UseQueryOptions;

export function useStatsReport< TParams extends StatsReportParams >(
	queryFactory: StatsReportQueryFactory< TParams >,
	params: TParams,
	disabledComparisonKey: string[],
	options?: UseStatsOptions
) {
	return useReport( p => queryFactory( p as TParams ), params, {
		enabled: options?.enabled,
		disabledComparisonKey,
	} );
}
