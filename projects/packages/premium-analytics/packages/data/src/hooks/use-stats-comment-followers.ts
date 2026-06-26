/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { statsCommentFollowersQuery } from '../queries/stats-comment-followers-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsCommentFollowersItem, StatsNormalizedReport } from '../processing/stats';
import type { StatsCommentFollowersParams } from '../queries/stats-comment-followers-query';

export type StatsCommentFollowersResponse = StatsNormalizedReport< StatsCommentFollowersItem >;
export type { StatsCommentFollowersParams } from '../queries/stats-comment-followers-query';

export function useStatsCommentFollowers(
	params: StatsCommentFollowersParams,
	options?: UseStatsOptions
) {
	const queryOptions = statsCommentFollowersQuery( params );
	const primary = useQuery( {
		...queryOptions,
		enabled: ( options?.enabled ?? true ) && ( queryOptions.enabled ?? true ),
	} );
	const comparison = useQuery( {
		queryKey: [ 'stats', 'comment-followers', '__comparison__', 'disabled' ],
		enabled: false,
	} );

	return {
		primary,
		comparison,
		hasComparison: false,
		isLoading: primary.isLoading,
		isFetching: primary.isFetching,
		hasData: Boolean( primary.data?.summary ) || Boolean( primary.data?.data?.length ),
		isError: primary.isError,
		error: primary.error,
		refetch: primary.refetch,
	};
}
