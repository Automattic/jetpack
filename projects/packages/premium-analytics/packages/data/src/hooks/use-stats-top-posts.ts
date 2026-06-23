/**
 * Internal dependencies
 */
import { statsTopPostsQuery } from '../queries/stats-top-posts-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsTopPosts( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport( statsTopPostsQuery, params, 'top-posts', options );
}
