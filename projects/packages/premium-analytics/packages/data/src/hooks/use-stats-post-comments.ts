/**
 * Internal dependencies
 */
import { statsPostCommentsQuery } from '../queries/stats-post-comments-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsPostCommentsParams,
	StatsPostCommentsResponse,
} from '../queries/stats-post-comments-query';

export type {
	StatsPostCommentsParams,
	StatsPostCommentsResponse,
} from '../queries/stats-post-comments-query';

export function useStatsPostComments( params: StatsPostCommentsParams, options?: UseStatsOptions ) {
	return useStatsQuery< StatsPostCommentsResponse >( statsPostCommentsQuery( params ), options );
}
