/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';

export type StatsTagsParams = Partial< StatsReportParams > & {
	max?: number;
};

// `max` is the only parameter the endpoint reads. `stats/tags` hardcodes a
// 7-day window server-side and discards every date parameter, so sending one
// cannot change the response — it only re-keys the React Query cache and the
// proxy's response cache per date selection, refetching identical rows.
// Verified against WPCOM through the proxy on 2026-08-27: `stats/tags` with
// `date=2024-12-31` and `date=2026-12-31` returned byte-identical bodies, both
// echoing `date` as the current day and carrying no `period` key, while
// `stats/top-posts` on the same proxy echoed each date back and bucketed by it.
function statsTagsParamsToApiParams( params: StatsTagsParams = {} ): StatsProxyParams {
	const statsParams = reportParamsToStatsQueryParams( params );

	return statsParams.max !== undefined ? { max: statsParams.max } : {};
}

export const statsTagsQuery = ( params: StatsTagsParams = {} ): StatsReportQueryOptions< 'tags' > =>
	statsProxyQuery( {
		name: 'tags',
		version: '1.1',
		endpoint: 'stats/tags',
		params: statsTagsParamsToApiParams( params ),
		sanitizer: 'tags',
	} );
