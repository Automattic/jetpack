/**
 * Internal dependencies
 */
import { statsReferrersQuery } from '../queries/stats-referrers-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsReferrers( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport( statsReferrersQuery, params, 'referrers', options );
}
