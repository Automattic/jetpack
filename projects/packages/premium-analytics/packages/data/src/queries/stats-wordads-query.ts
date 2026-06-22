/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsWordAdsStatsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'wordads-stats',
		version: '1.1',
		endpoint: 'wordads/stats',
		params,
		sanitizer: 'timeSeries',
	} );

export const statsWordAdsEarningsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'wordads-earnings',
		version: '1.1',
		endpoint: 'wordads/earnings',
		params,
	} );
