/**
 * Internal dependencies
 */
import { statsCommentFollowersQuery } from '../queries/stats-comment-followers-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsCommentFollowersItem, StatsNormalizedReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export type StatsCommentFollowersResponse = StatsNormalizedReport< StatsCommentFollowersItem >;

export function useStatsCommentFollowers( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsCommentFollowersQuery,
		params,
		[ 'stats', 'comment-followers', '__comparison__', 'disabled' ],
		options
	);
}
