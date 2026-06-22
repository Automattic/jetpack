/**
 * Internal dependencies
 */
import { statsWordAdsEarningsQuery, statsWordAdsStatsQuery } from '../queries/stats-wordads-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsWordAdsStats( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsWordAdsStatsQuery( params ), options );
}

export function useStatsWordAdsEarnings( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsWordAdsEarningsQuery( params ), options );
}
