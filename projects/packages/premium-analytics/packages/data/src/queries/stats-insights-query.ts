/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsInsightsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'insights', version: '1.1', endpoint: 'stats/insights', params } );
