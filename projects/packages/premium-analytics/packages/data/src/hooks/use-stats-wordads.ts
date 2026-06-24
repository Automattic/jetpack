/**
 * Internal dependencies
 */
import { statsWordAdsEarningsQuery, statsWordAdsStatsQuery } from '../queries/stats-wordads-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsWordAdsStatsResponse } from '../queries/stats-wordads-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type {
	StatsWordAdsEarnings,
	StatsWordAdsEarningsBreakdown,
	StatsWordAdsEarningsPeriod,
	StatsWordAdsEarningsResponse,
	StatsWordAdsStatsResponse,
} from '../queries/stats-wordads-query';

export function useStatsWordAdsStats( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery< StatsWordAdsStatsResponse >( statsWordAdsStatsQuery( params ), options );
}

export function useStatsWordAdsEarnings( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsWordAdsEarningsQuery( params ), options );
}
