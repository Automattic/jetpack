/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';

export type StatsCommentsParams = Record< string, never >;

export type { StatsCommentsResponse } from '../processing/stats';

export const statsCommentsQuery = (
	params: StatsCommentsParams = {}
): StatsReportQueryOptions< 'comments' > =>
	statsProxyQuery( {
		name: 'comments',
		version: '1.1',
		endpoint: 'stats/comments',
		params,
		sanitizer: 'comments',
	} );
