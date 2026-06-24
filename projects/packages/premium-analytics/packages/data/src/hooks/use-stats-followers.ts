/**
 * Internal dependencies
 */
import { statsFollowersQuery } from '../queries/stats-followers-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export type { StatsFollowersResponse } from '../queries/stats-followers-query';

export function useStatsFollowers( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsFollowersQuery,
		params,
		[ 'stats', 'followers', '__comparison__', 'disabled' ],
		options
	);
}
