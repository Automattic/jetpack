/**
 * Internal dependencies
 */
import {
	statsSubscribersCountsQuery,
	statsSubscribersQuery,
} from '../queries/stats-subscribers-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsSubscribersCounts, StatsSubscribersResponse } from '../processing/stats';
import type {
	StatsSubscribersCountsParams,
	StatsSubscribersParams,
} from '../queries/stats-subscribers-query';
import type { UseQueryResult } from '@tanstack/react-query';

export type { StatsSubscribersCounts, StatsSubscribersResponse } from '../processing/stats';
export type {
	StatsSubscribersCountsParams,
	StatsSubscribersParams,
} from '../queries/stats-subscribers-query';
export type StatsSubscribersCountsResponse = StatsSubscribersCounts;

export function useStatsSubscribers(
	params: StatsSubscribersParams,
	options?: UseStatsOptions
): UseQueryResult< StatsSubscribersResponse > {
	return useStatsQuery( statsSubscribersQuery( params ), options );
}

export function useStatsSubscribersCounts(
	params?: StatsSubscribersCountsParams,
	options?: UseStatsOptions
): UseQueryResult< StatsSubscribersCountsResponse > {
	return useStatsQuery( statsSubscribersCountsQuery( params ), options );
}
