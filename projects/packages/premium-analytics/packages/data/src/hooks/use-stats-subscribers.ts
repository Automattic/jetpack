/**
 * External dependencies
 */
import { useQueries } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import {
	statsMembershipProductsQuery,
	statsSubscribersCountsQuery,
	statsSubscribersDaysAgoQuery,
	statsSubscribersReportQuery,
} from '../queries/stats-subscribers-query';
import { isAwaitingData } from './awaiting-data';
import { REFRESH_NOTICE_META } from './refresh-failure-scope';
import { getStatsQueryEnabled, useStatsQuery } from './use-stats-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsSubscribersCounts, StatsSubscribersResponse } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';
import type { StatsSubscribersCountsParams } from '../queries/stats-subscribers-query';

export type {
	StatsMembershipProducts,
	StatsSubscribersCounts,
	StatsSubscribersResponse,
} from '../processing/stats';
export type {
	StatsSubscribersCountsParams,
	StatsSubscribersParams,
	StatsSubscribersUnit,
} from '../queries/stats-subscribers-query';
export type StatsSubscribersCountsResponse = StatsSubscribersCounts;

export type StatsSubscribersDaysAgo = {
	counts: Array< number | undefined >;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
};

export function useStatsSubscribersReport( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsReportParams, StatsSubscribersResponse >(
		statsSubscribersReportQuery,
		params,
		[ 'stats', 'subscribers', '__comparison__', 'disabled' ],
		options
	);
}

/**
 * The subscriber count on each of the site-local days `daysAgo` names, in order.
 * A day the endpoint returns no point for reads as `undefined`.
 */
export function useStatsSubscribersDaysAgo(
	daysAgo: readonly number[],
	options?: UseStatsOptions
): StatsSubscribersDaysAgo {
	return useQueries( {
		queries: daysAgo.map( days => {
			const query = statsSubscribersDaysAgoQuery( days );
			return {
				...query,
				enabled: getStatsQueryEnabled( query, options ),
				meta: { ...query.meta, ...REFRESH_NOTICE_META },
			};
		} ),
		combine: results => ( {
			counts: results.map( ( { data } ) => {
				const point = data?.data?.[ 0 ];
				return point?.subscribers ?? point?.value;
			} ),
			isLoading: results.some( isAwaitingData ),
			isFetching: results.some( result => result.isFetching ),
			isError: results.some( result => result.isError ),
			refetch: () => results.forEach( result => result.refetch() ),
		} ),
	} );
}

export function useStatsMembershipProducts( options?: UseStatsOptions ) {
	return useStatsQuery( statsMembershipProductsQuery(), options );
}

export function useStatsSubscribersCounts(
	params?: StatsSubscribersCountsParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsSubscribersCountsQuery( params ), options );
}
