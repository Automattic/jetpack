/**
 * Internal dependencies
 */
import { statsInsightsQuery } from '../queries/stats-insights-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsInsightsParams } from '../queries/stats-insights-query';

export type {
	StatsInsightsParams,
	StatsInsightsResponse,
	StatsInsightsYear,
} from '../queries/stats-insights-query';

export function useStatsInsights( params?: StatsInsightsParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsInsightsQuery( params ), options );
}
