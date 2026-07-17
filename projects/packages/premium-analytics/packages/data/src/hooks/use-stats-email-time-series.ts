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
import { useStatsReport, type UseStatsOptions } from './use-stats-report';

export function useStatsEmailOpensTimeSeries(
	postId: number,
	params: StatsEmailTimeSeriesParams,
	options?: UseStatsOptions
) {
	return useStatsReport< StatsEmailTimeSeriesParams, StatsEmailTimeSeriesReport >(
		p => statsEmailOpensTimeSeriesQuery( postId, p ),
		params,
		[ 'stats', 'email-opens-time-series', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsEmailClicksTimeSeries(
	postId: number,
	params: StatsEmailTimeSeriesParams,
	options?: UseStatsOptions
) {
	return useStatsReport< StatsEmailTimeSeriesParams, StatsEmailTimeSeriesReport >(
		p => statsEmailClicksTimeSeriesQuery( postId, p ),
		params,
		[ 'stats', 'email-clicks-time-series', '__comparison__', 'disabled' ],
		options
	);
}

export type {
	StatsEmailTimeSeriesParams,
	StatsEmailTimeSeriesPeriod,
	StatsEmailTimeSeriesReport,
	StatsEmailTimeSeriesDataPoint,
	StatsEmailTimeSeriesSummary,
};
