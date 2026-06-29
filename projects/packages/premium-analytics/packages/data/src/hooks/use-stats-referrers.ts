/**
 * Internal dependencies
 */
import { statsReferrersQuery } from '../queries/stats-referrers-query';
import { useStatsReport } from './use-stats-report';
import type { UseReportResult } from './use-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsNormalizedReport, StatsReferrersItem } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsReferrers(
	params: StatsReportParams,
	options?: UseStatsOptions
): UseReportResult< StatsNormalizedReport< StatsReferrersItem > > {
	return useStatsReport( statsReferrersQuery, params, 'referrers', options );
}
