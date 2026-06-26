/**
 * Internal dependencies
 */
import { statsFollowersQuery } from '../queries/stats-followers-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsFollowersParams } from '../queries/stats-followers-query';

export type { StatsFollowersResponse } from '../queries/stats-followers-query';
export type { StatsFollowersParams } from '../queries/stats-followers-query';

export function useStatsFollowers( params: StatsFollowersParams = {}, options?: UseStatsOptions ) {
	return useStatsQuery( statsFollowersQuery( params ), options );
}
