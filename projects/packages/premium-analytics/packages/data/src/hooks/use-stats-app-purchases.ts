/**
 * Internal dependencies
 */
import { statsAppPurchasesQuery } from '../queries/stats-app-purchases-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsAppPurchases( params?: StatsQueryParams, options?: UseStatsAppOptions ) {
	return useStatsAppQuery( statsAppPurchasesQuery( params ), options );
}
