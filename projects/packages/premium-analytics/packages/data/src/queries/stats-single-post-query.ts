/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsSinglePostQuery = (
	postId: number,
	params: StatsQueryParams = {}
): StatsReportQueryOptions< 'timeSeries' > =>
	statsProxyQuery( {
		name: 'single-post',
		version: '1.1',
		endpoint: `stats/post/${ postId }`,
		params,
		sanitizer: 'timeSeries',
		enabled: postId > 0,
	} );
