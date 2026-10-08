/**
 * Internal dependencies
 */
import { statsAuthorQuery } from '../queries/stats-author-query';
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
// Every month since the author's views start: `num=-1` with no window.
const ALL_TIME_PARAMS = { period: 'month', num: -1 } as const;

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
	return useStatsAuthor( authorId, ALL_TIME_PARAMS, options );
}

export function useStatsAuthor(
	authorId: number,
	params: StatsAuthorParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsAuthorQuery( authorId, params ), options );
}
