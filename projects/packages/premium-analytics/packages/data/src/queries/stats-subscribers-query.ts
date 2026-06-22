/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsSubscribersQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'subscribers',
		version: '1.1',
		endpoint: 'stats/subscribers',
		params,
		sanitizer: 'timeSeries',
	} );

export const statsSubscribersCountsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'subscribers-counts',
		version: '2',
		endpoint: 'subscribers/counts',
		params,
	} );
