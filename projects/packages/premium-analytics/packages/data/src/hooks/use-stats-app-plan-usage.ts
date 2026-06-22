/**
 * Internal dependencies
 */
import { statsAppPlanUsageQuery } from '../queries/stats-app-plan-usage-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsAppPlanUsage( params?: StatsQueryParams, options?: UseStatsAppOptions ) {
	return useStatsAppQuery( statsAppPlanUsageQuery( params ), options );
}
