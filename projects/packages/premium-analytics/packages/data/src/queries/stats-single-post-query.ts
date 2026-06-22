/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsSinglePostQuery = ( postId: number, params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'single-post',
		version: '1.1',
		endpoint: `stats/post/${ postId }`,
		params,
		sanitizer: 'timeSeries',
	} );
