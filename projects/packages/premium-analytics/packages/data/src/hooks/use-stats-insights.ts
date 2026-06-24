/**
 * Internal dependencies
 */
import { statsInsightsQuery } from '../queries/stats-insights-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsInsights( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsInsightsQuery( params ), options );
}
