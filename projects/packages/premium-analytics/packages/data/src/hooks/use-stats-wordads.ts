/**
 * Internal dependencies
 */
import { statsWordAdsEarningsQuery, statsWordAdsStatsQuery } from '../queries/stats-wordads-query';
import { useStatsQuery } from './use-stats-query';
import { useStatsReport, type UseStatsOptions } from './use-stats-report';
import type { StatsWordAdsEarningsResponse, StatsWordAdsResponse } from '../processing/stats';
import type {
	StatsWordAdsEarningsParams,
	StatsWordAdsParams,
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
	StatsWordAdsDataPoint,
	StatsWordAdsRawField,
	StatsWordAdsRawResponse,
	StatsWordAdsResponse,
} from '../processing/stats';
export type {
	StatsWordAdsEarningsParams,
	StatsWordAdsParams,
} from '../queries/stats-wordads-query';

export function useStatsWordAdsStats( params: StatsWordAdsParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsWordAdsParams, StatsWordAdsResponse >(
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
