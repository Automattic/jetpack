/**
 * Internal dependencies
 */
import { statsInsightsQuery } from '../queries/stats-insights-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsInsightsParams, StatsInsightsResponse } from '../queries/stats-insights-query';
import type { UseQueryResult } from '@tanstack/react-query';

export type {
	StatsInsightsParams,
	StatsInsightsResponse,
	StatsInsightsYear,
} from '../queries/stats-insights-query';

export function useStatsInsights(
	params?: StatsInsightsParams,
	options?: UseStatsOptions
): UseQueryResult< StatsInsightsResponse > {
	return useStatsQuery( statsInsightsQuery( params ), options );
}
