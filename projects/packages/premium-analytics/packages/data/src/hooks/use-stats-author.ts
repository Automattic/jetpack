/**
 * Internal dependencies
 */
import {
	STATS_AUTHOR_ALL_TIME_PARAMS,
	statsAuthorAllTimeOrApproximateQuery,
	statsAuthorQuery,
} from '../queries/stats-author-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsAuthorParams } from '../queries/stats-author-query';

/**
 * One author's views, likes and comments over a window, from `stats/author/<id>`.
 * Unlike `stats/top-authors`, it is not capped to the period's top authors.
 *
 * @param authorId - The author's user ID; `0` disables the request.
 * @param params   - The window and bucket period.
 * @param options  - Query options.
 * @return The query result.
 */
/**
 * Every month of an author's views, back to where their views start. The
 * author page's All time start and its All-time traffic table read this one
 * request, so they cannot disagree.
 *
 * @param authorId - The author's user ID; `0` disables the request.
 * @param options  - Query options.
 * @return The query result; `startDate` is the first day the author's views can start.
 */
export function useStatsAuthorAllTime( authorId: number, options?: UseStatsOptions ) {
	return useStatsAuthor( authorId, STATS_AUTHOR_ALL_TIME_PARAMS, options );
}

/**
 * The author's all-time report, or today's approximate one when they are past
 * the post limit; the author page header and its All time start read this.
 *
 * @param authorId - The author's user ID; `0` disables the request.
 * @return The query result.
 */
export function useStatsAuthorAllTimeOrApproximate( authorId: number ) {
	return useStatsQuery( statsAuthorAllTimeOrApproximateQuery( authorId ) );
}

export function useStatsAuthor(
	authorId: number,
	params: StatsAuthorParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsAuthorQuery( authorId, params ), options );
}
