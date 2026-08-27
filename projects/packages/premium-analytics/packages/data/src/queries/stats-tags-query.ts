/**
 * Internal dependencies
 */
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';

export type StatsTagsParams = Partial< StatsReportParams > & {
	max?: number;
};

// `max` is the only parameter the endpoint reads.
//
// The window is fixed at the 7 days ending yesterday, hardcoded in the wpcom
// endpoint rather than derived from the request:
//
//   // class.wpcom-json-api-stats-tags-and-categories-v1-1-endpoint.php
//   $data = stats_show_tagviews( $site_id, stats_yesterday(), 7, $max, true, true );
//
// and its registration in class.wpcom-stats-api-endpoints.php declares `max` as
// its only query parameter, so `date`, `period`, `num`, `start_date` and
// `end_date` are all discarded (source quoted in WOOA7S-1962).
//
// Confirmed from the client side through the proxy on 2026-08-27: `stats/tags`
// with `date=2024-12-31` and `date=2026-12-31` returned byte-identical bodies,
// both echoing `date` as the current day and carrying no `period` key, while
// `stats/top-posts` on the same proxy echoed each date back and bucketed by it.
//
// So forwarding a date cannot change the response — it only re-keys the React
// Query cache and the proxy's response cache per date selection, refetching
// identical rows.
function statsTagsParamsToApiParams( params: StatsTagsParams = {} ): StatsProxyParams {
	return params.max !== undefined && params.max !== null ? { max: params.max } : {};
}

export const statsTagsQuery = ( params: StatsTagsParams = {} ): StatsReportQueryOptions< 'tags' > =>
	statsProxyQuery( {
		name: 'tags',
		version: '1.1',
		endpoint: 'stats/tags',
		params: statsTagsParamsToApiParams( params ),
		sanitizer: 'tags',
	} );
