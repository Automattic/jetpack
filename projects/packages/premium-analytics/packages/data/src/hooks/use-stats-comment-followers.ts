/**
 * Internal dependencies
 */
import { statsCommentFollowersQuery } from '../queries/stats-comment-followers-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsCommentFollowersParams,
	StatsCommentFollowersResponse,
} from '../queries/stats-comment-followers-query';
import type { UseQueryResult } from '@tanstack/react-query';

export type { StatsCommentFollowersParams, StatsCommentFollowersResponse };

export function useStatsCommentFollowers(
	params: StatsCommentFollowersParams = {},
	options?: UseStatsOptions
): UseQueryResult< StatsCommentFollowersResponse > {
	return useStatsQuery< StatsCommentFollowersResponse >(
		statsCommentFollowersQuery( params ),
		options
	);
}
