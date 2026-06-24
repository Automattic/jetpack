/**
 * Internal dependencies
 */
import {
	statsSubscribersCountsQuery,
	statsSubscribersQuery,
} from '../queries/stats-subscribers-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsNormalizedReport } from '../processing/stats';
import type { StatsQueryParams } from '../utils/stats-params';

export type StatsSubscribersResponse = StatsNormalizedReport;

export type StatsSubscribersCounts = {
	total_subscribers: number;
	email_subscribers: number;
	paid_subscribers: number;
	social_followers: number;
};

export type StatsSubscribersCountsResponse = {
	counts: StatsSubscribersCounts;
};

export function useStatsSubscribers( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery< StatsSubscribersResponse >( statsSubscribersQuery( params ), options );
}

export function useStatsSubscribersCounts( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsSubscribersCountsQuery( params ), options );
}
