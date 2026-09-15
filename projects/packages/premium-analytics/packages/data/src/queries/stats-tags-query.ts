/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';

/**
 * `stats/tags` declares `max` as its only query parameter, so WPCOM strips
 * everything else — `date` included — before the handler runs: the window is a
 * hardcoded seven days ending yesterday in site time, and nothing can move it.
 */
export type StatsTagsParams = {
	/**
	 * Rows to request. `max` only truncates an already-ranked list, so a larger one
	 * adds rows without moving a row's views. `0` is not "all rows" here — anything
	 * below 1 is floored back to the endpoint's default of 10, so it is left off the
	 * request rather than sent to be silently rewritten.
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
