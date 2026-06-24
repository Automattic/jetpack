/**
 * Internal dependencies
 */
import { statsVisitsQuery } from '../queries/stats-visits-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export type StatsVisitsParams = StatsReportParams & {
	stat_fields?: string;
};

export function useStatsVisits( params: StatsVisitsParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsVisitsQuery,
		params,
		[ 'stats', 'visits', '__comparison__', 'disabled' ],
		options
	);
}
