/**
 * Internal dependencies
 */
import { statsAppPurchasesQuery } from '../queries/stats-app-purchases-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type {
	StatsAppPurchase,
	StatsAppPurchaseExpiryStatus,
	StatsAppPurchasesParams,
	StatsAppPurchasesResponse,
} from '../queries/stats-app-purchases-query';

export type {
	StatsAppPurchase,
	StatsAppPurchaseExpiryStatus,
	StatsAppPurchasesParams,
	StatsAppPurchasesResponse,
};

export function useStatsAppPurchases(
	params?: StatsAppPurchasesParams,
	options?: UseStatsAppOptions
) {
	return useStatsAppQuery( statsAppPurchasesQuery( params ), options );
}
