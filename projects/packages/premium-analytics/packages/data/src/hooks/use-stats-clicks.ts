/**
 * Internal dependencies
 */
import { statsClicksQuery } from '../queries/stats-clicks-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsClicks( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport( statsClicksQuery, params, 'clicks', options );
}
