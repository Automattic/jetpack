/**
 * Internal dependencies
 */
import { statsSinglePostQuery } from '../queries/stats-single-post-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsSinglePost(
	postId: number,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsSinglePostQuery( postId, params ), options );
}
