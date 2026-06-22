/**
 * Internal dependencies
 */
import { statsEmailSummaryQuery } from '../queries/stats-email-summary-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsEmailSummary( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsEmailSummaryQuery( params ), options );
}
