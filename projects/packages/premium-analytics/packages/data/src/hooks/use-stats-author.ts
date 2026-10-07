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
export function useStatsAuthor(
	authorId: number,
	params: StatsAuthorParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsAuthorQuery( authorId, params ), options );
}
