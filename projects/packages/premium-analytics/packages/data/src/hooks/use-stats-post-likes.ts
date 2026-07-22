/**
 * Internal dependencies
 */
import { statsPostLikesQuery } from '../queries/stats-post-likes-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsPostLikesParams,
	StatsPostLikesResponse,
} from '../queries/stats-post-likes-query';

export type {
	StatsPostLikesParams,
	StatsPostLikesResponse,
} from '../queries/stats-post-likes-query';

export function useStatsPostLikes( params: StatsPostLikesParams, options?: UseStatsOptions ) {
	return useStatsQuery< StatsPostLikesResponse >( statsPostLikesQuery( params ), options );
}
