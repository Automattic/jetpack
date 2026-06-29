/**
 * Internal dependencies
 */
import { statsTopPostsQuery } from '../queries/stats-top-posts-query';
import { useStatsReport } from './use-stats-report';
import type { UseReportResult } from './use-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsNormalizedReport, StatsTopPostsItem } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsTopPosts(
	params: StatsReportParams,
	options?: UseStatsOptions
): UseReportResult< StatsNormalizedReport< StatsTopPostsItem > > {
	return useStatsReport( statsTopPostsQuery, params, 'top-posts', options );
}
