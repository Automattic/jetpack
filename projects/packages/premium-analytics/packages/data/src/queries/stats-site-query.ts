/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsSiteQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'site',
		version: '1.1',
		endpoint: 'stats',
		params,
		sanitizer: 'site',
	} );
