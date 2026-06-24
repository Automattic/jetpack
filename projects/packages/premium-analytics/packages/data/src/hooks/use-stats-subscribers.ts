/**
 * Internal dependencies
 */
import {
	statsSubscribersCountsQuery,
	statsSubscribersQuery,
} from '../queries/stats-subscribers-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsSubscribers( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsSubscribersQuery( params ), options );
}

export function useStatsSubscribersCounts( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsSubscribersCountsQuery( params ), options );
}
