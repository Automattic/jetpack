/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

/**
 * Past this many days the endpoint ranks the window's top posts in one pass
 * instead of day by day, which keeps a long window to a few queries.
 */
const SUMMARIZE_MIN_DAYS = 31;

export type StatsTagsParams = StatsReportParams & {
	/**
	 * Rows to request. `max` only truncates an already-ranked list, so a larger one
	 * adds rows without moving a row's views. `0` is not "all rows" here — anything
	 * below 1 is floored back to the endpoint's default of 10, so it is left off the
	 * request rather than sent to be silently rewritten.
	 */
	max?: number;
};

/**
 * `stats/tags` sizes its window from `date` and `start_date` (the days are
 * derived server-side, so `days` stays off the request) and takes `summarize`
 * on its own terms: per-day ranking under a month, as classic Stats reads it.
 */
export const statsTagsQuery = ( params: StatsTagsParams ): StatsReportQueryOptions< 'tags' > => {
	const { max, ...reportParams } = params;
	const { days } = reportParamsToStatsQueryParams( reportParams );
	const summarize = typeof days === 'number' && days > SUMMARIZE_MIN_DAYS;

	return statsReportQuery(
		'tags',
		'stats/tags',
		reportParams,
		'tags',
		'1.1',
		( max ?? 0 ) > 0 ? { max } : undefined,
		{ omitParams: summarize ? [ 'days' ] : [ 'days', 'summarize' ] }
	);
};
