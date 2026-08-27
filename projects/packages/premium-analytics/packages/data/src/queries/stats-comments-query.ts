/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';

// The endpoint accepts no parameters at all — its public API reference lists no
// endpoint-specific query parameters, and reports `total_comments` as the
// "number of total comments":
// https://developer.wordpress.com/docs/api/1.1/get/sites/$site/stats/comments/
//
// So both comment leaderboards are all-time and cannot follow a date range,
// which is what they tell the user. Adding date support is WOOA7S-1965.
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
