/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsStreakQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'streak',
		version: '1.1',
		endpoint: 'stats/streak',
		params,
	} );
