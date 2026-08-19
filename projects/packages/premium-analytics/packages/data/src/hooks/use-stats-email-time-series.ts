/**
 * Internal dependencies
 */
import {
	statsEmailClicksTimeSeriesQuery,
	statsEmailOpensTimeSeriesQuery,
	type StatsEmailTimeSeriesParams,
	type StatsEmailTimeSeriesPeriod,
	type StatsEmailTimeSeriesReport,
	type StatsEmailTimeSeriesDataPoint,
	type StatsEmailTimeSeriesSummary,
} from '../queries/stats-email-time-series-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';

export function useStatsEmailOpensTimeSeries(
	postId: number,
	params: StatsEmailTimeSeriesParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsEmailOpensTimeSeriesQuery( postId, params ), options );
}

export function useStatsEmailClicksTimeSeries(
	postId: number,
	params: StatsEmailTimeSeriesParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsEmailClicksTimeSeriesQuery( postId, params ), options );
}

export type {
	StatsEmailTimeSeriesParams,
	StatsEmailTimeSeriesPeriod,
	StatsEmailTimeSeriesReport,
	StatsEmailTimeSeriesDataPoint,
	StatsEmailTimeSeriesSummary,
};
