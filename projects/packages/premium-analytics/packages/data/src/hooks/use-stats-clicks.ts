/**
 * Internal dependencies
 */
import { statsClicksQuery } from '../queries/stats-clicks-query';
import { useStatsReport } from './use-stats-report';
import type { UseReportResult } from './use-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsClicksItem, StatsNormalizedReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsClicks(
	params: StatsReportParams,
	options?: UseStatsOptions
): UseReportResult< StatsNormalizedReport< StatsClicksItem > > {
	return useStatsReport( statsClicksQuery, params, 'clicks', options );
}
