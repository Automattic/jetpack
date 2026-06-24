/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsHighlightsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'highlights', version: '1.1', endpoint: 'stats/highlights', params } );
