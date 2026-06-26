/**
 * Internal dependencies
 */
import { statsWordAdsEarningsQuery, statsWordAdsStatsQuery } from '../queries/stats-wordads-query';
import { useStatsQuery } from './use-stats-query';
import { useStatsReport, type UseStatsOptions } from './use-stats-report';
import type { StatsWordAdsEarningsResponse, StatsWordAdsStatsResponse } from '../processing/stats';
import type {
	StatsWordAdsEarningsParams,
	StatsWordAdsStatsParams,
} from '../queries/stats-wordads-query';

export type {
	StatsWordAdsEarnings,
	StatsWordAdsEarningsBreakdown,
	StatsWordAdsEarningsPeriod,
	StatsWordAdsEarningsRaw,
	StatsWordAdsEarningsRawBreakdown,
	StatsWordAdsEarningsRawPeriod,
	StatsWordAdsEarningsRawResponse,
	StatsWordAdsEarningsResponse,
	StatsWordAdsStatsDataPoint,
	StatsWordAdsStatsRawField,
	StatsWordAdsStatsRawResponse,
	StatsWordAdsStatsResponse,
} from '../processing/stats';
export type {
	StatsWordAdsEarningsParams,
	StatsWordAdsStatsParams,
} from '../queries/stats-wordads-query';

export function useStatsWordAdsStats( params: StatsWordAdsStatsParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsWordAdsStatsParams, StatsWordAdsStatsResponse >(
		statsWordAdsStatsQuery,
		params,
		[ 'stats', 'wordads-stats', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsWordAdsEarnings(
	params?: StatsWordAdsEarningsParams,
	options?: UseStatsOptions
) {
	return useStatsQuery< StatsWordAdsEarningsResponse >(
		statsWordAdsEarningsQuery( params ),
		options
	);
}
