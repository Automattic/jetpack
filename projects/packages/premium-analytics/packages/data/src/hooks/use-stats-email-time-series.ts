/**
 * Internal dependencies
 */
import {
	statsEmailClicksTimeSeriesQuery,
	statsEmailOpensTimeSeriesQuery,
} from '../queries/stats-email-time-series-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsEmailOpensTimeSeries(
	postId: number,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsEmailOpensTimeSeriesQuery( postId, params ), options );
}

export function useStatsEmailClicksTimeSeries(
	postId: number,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsEmailClicksTimeSeriesQuery( postId, params ), options );
}
