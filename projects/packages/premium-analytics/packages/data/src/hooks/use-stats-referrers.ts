/**
 * Internal dependencies
 */
import { useStatsReport } from './use-stats-report';
import { statsReferrersQuery } from '../queries/stats-referrers-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsReferrers( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsReferrersQuery,
		params,
		[ 'stats', 'referrers', '__comparison__', 'disabled' ],
		options
	);
}
