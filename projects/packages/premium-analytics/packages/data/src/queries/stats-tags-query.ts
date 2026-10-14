/**
 * Internal dependencies
 */
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

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
 * derived server-side, so `days` stays off the request) and always ranks the
 * window's top posts in one pass. Per-day ranking keeps 50 posts a day while
 * one pass keeps 50 for the window, so mixing the two by window length would
 * let a longer range count fewer posts than a shorter one.
 */
export const statsTagsQuery = ( params: StatsTagsParams ): StatsReportQueryOptions< 'tags' > => {
	const { max, ...reportParams } = params;

	return statsReportQuery(
		'tags',
		'stats/tags',
		reportParams,
		'tags',
		'1.1',
		// Explicit: the shared derivation adds `summarize` only past one day.
		{ ...( ( max ?? 0 ) > 0 ? { max } : {} ), summarize: 1 },
		{ omitParams: [ 'days' ] }
	);
};
