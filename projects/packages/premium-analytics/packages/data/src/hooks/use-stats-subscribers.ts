/**
 * Internal dependencies
 */
import {
	statsSubscribersCountsQuery,
	statsSubscribersReportQuery,
} from '../queries/stats-subscribers-query';
import { useStatsQuery } from './use-stats-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsSubscribersCounts, StatsSubscribersResponse } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';
import type { StatsSubscribersCountsParams } from '../queries/stats-subscribers-query';

export type { StatsSubscribersCounts, StatsSubscribersResponse } from '../processing/stats';
export type {
	StatsSubscribersCountsParams,
	StatsSubscribersParams,
	StatsSubscribersUnit,
} from '../queries/stats-subscribers-query';
export type StatsSubscribersCountsResponse = StatsSubscribersCounts;

export function useStatsSubscribersReport( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsReportParams, StatsSubscribersResponse >(
		statsSubscribersReportQuery,
		params,
		[ 'stats', 'subscribers', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsSubscribersCounts(
	params?: StatsSubscribersCountsParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsSubscribersCountsQuery( params ), options );
}
