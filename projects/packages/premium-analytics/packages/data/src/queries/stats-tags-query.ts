/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';
import type { StatsProxyParams } from '../api';

// Deliberately narrow: the endpoint takes no date window (see below), so the
// type must not let a caller pass one and assume it applies.
export type StatsTagsParams = {
	/**
	 * Maximum rows to return; `0` means all. The only parameter the endpoint reads.
	 */
	max?: number;
};

// `max` is the only parameter this endpoint accepts. Its public API reference
// lists exactly one endpoint-specific query parameter:
//
//   max (int) — the maximum number of tags to include in result. Default: 10.
//   https://developer.wordpress.com/docs/api/1.1/get/sites/$site/stats/tags/
//
// where the neighbouring `stats/top-posts` declares `num`, `period`, `date`,
// `start_date`, `offset` and `summarize`. So `stats/tags` takes no date window;
// the response's `date` field is documented as "the most-recent day for which
// stats are returned", not a range anchor.
//
// The window it does serve is the 7 days ending yesterday, hardcoded in the
// wpcom endpoint rather than derived from the request (source quoted in
// WOOA7S-1962):
//
//   $data = stats_show_tagviews( $site_id, stats_yesterday(), 7, $max, true, true );
//
// Confirmed from the client side through the proxy on 2026-08-27: `stats/tags`
// with `date=2024-12-31` and `date=2026-12-31` returned byte-identical bodies,
// both echoing `date` as the current day, while `stats/top-posts` on the same
// proxy echoed each date back and bucketed by it.
//
// So forwarding a date cannot change the response — it only re-keys the React
// Query cache and the proxy's response cache per date selection, refetching
// identical rows.
function statsTagsParamsToApiParams( params: StatsTagsParams = {} ): StatsProxyParams {
	// `!== undefined`, not truthiness: the Tags report passes `max: 0` for "all
	// rows", which a truthy check would drop back to the endpoint's default of 10.
	return params.max !== undefined ? { max: params.max } : {};
}

export const statsTagsQuery = ( params: StatsTagsParams = {} ): StatsReportQueryOptions< 'tags' > =>
	statsProxyQuery( {
		name: 'tags',
		version: '1.1',
		endpoint: 'stats/tags',
		params: statsTagsParamsToApiParams( params ),
		sanitizer: 'tags',
	} );
