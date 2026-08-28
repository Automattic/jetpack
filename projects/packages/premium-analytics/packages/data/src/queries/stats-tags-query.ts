/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';

/**
 * `stats/tags` declares `max` as its only query parameter, so WPCOM's
 * `query_args()` strips everything else — including `date` — before the handler
 * runs. The window is hardcoded to the seven days ending yesterday in site time:
 * today never counts, and no parameter can move it. Sending a date would only
 * split the query cache per selected period while returning the same rows.
 */
export type StatsTagsParams = {
	/**
	 * Rows to request. The server groups and ranks every tag first, over its own
	 * fixed scan of the site's 50 most-viewed posts, and truncates last — so a
	 * larger `max` adds rows but never changes a row's views. `0` does not mean
	 * "all rows": anything below 1 is floored back to the endpoint's default of
	 * 10, so it is left off the request rather than sent as a value the server
	 * would silently rewrite.
	 */
	max?: number;
};

export const statsTagsQuery = ( params: StatsTagsParams = {} ): StatsReportQueryOptions< 'tags' > =>
	statsProxyQuery( {
		name: 'tags',
		version: '1.1',
		endpoint: 'stats/tags',
		params: ( params.max ?? 0 ) > 0 ? { max: params.max } : {},
		sanitizer: 'tags',
	} );
