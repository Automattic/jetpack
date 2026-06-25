/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsPeriod } from '../utils/stats-params';

export const statsSubscribersDefaultStatFields = 'subscribers,subscribers_paid';

export type StatsSubscribersParams = {
	unit: StatsPeriod | string;
	quantity: number;
	date: string;
	stat_fields?: string;
};

export type StatsSubscribersCountsParams = Record< string, never >;

export const statsSubscribersQuery = (
	params: StatsSubscribersParams
): StatsReportQueryOptions< 'subscribers' > =>
	statsProxyQuery( {
		name: 'subscribers',
		version: '1.1',
		endpoint: 'stats/subscribers',
		params: {
			unit: params.unit,
			quantity: params.quantity,
			date: params.date,
			stat_fields: params.stat_fields ?? statsSubscribersDefaultStatFields,
		},
		sanitizer: 'subscribers',
	} );

export const statsSubscribersCountsQuery = (
	params: StatsSubscribersCountsParams = {}
): StatsReportQueryOptions< 'subscribersCounts' > =>
	statsProxyQuery( {
		name: 'subscribers-counts',
		version: '2',
		endpoint: 'subscribers/counts',
		params,
		sanitizer: 'subscribersCounts',
	} );
