/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsEmailOpensTimeSeriesQuery = ( postId: number, params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'email-opens-time-series',
		version: '1.1',
		endpoint: `stats/opens/emails/${ postId }`,
		params,
		sanitizer: 'timeSeries',
	} );

export const statsEmailClicksTimeSeriesQuery = ( postId: number, params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'email-clicks-time-series',
		version: '1.1',
		endpoint: `stats/clicks/emails/${ postId }`,
		params,
		sanitizer: 'timeSeries',
	} );
