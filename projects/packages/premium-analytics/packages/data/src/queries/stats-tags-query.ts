/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';

/**
 * `stats/tags` declares `max` as its only query parameter, so WPCOM's
 * `query_args()` strips everything else — including `date` — before the handler
 * runs. The window is a hardcoded last-7-days anchored on the request instant,
 * which no parameter can move. Sending a date would only split the query cache
 * per selected period while returning the same rows.
 */
export type StatsTagsParams = {
	/**
	 * Rows to request. `0` does not mean "all rows" here: the endpoint floors
	 * anything below 1 back to its own default of 10, so it is left off the
	 * request rather than sent as a value the server would silently rewrite.
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
