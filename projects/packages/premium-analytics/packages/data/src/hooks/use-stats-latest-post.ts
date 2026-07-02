/**
 * Internal dependencies
 */
import { statsLatestPostQuery } from '../queries/stats-latest-post-query';
import { useStatsPost } from './use-stats-post';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsLatestPost } from '../processing/stats';
import type { StatsLatestPostResponse } from '../queries/stats-latest-post-query';

export type { StatsLatestPost, StatsLatestPostResponse };

export type StatsLatestPostWithViews = StatsLatestPost & { views: number };

export type UseStatsLatestPostResult = {
	post: StatsLatestPostWithViews | null;
	isLoading: boolean;
	isError: boolean;
};

/**
 * The site's most recent published post with its all-time views. The post's
 * likes and comments come from the posts list; its views require a second,
 * dependent request keyed by the resolved post ID.
 *
 * @param options - Shared stats query options (e.g. `enabled`).
 * @return The latest post with views, plus combined loading/error state.
 */
export function useStatsLatestPost( options?: UseStatsOptions ): UseStatsLatestPostResult {
	const latestPostResult = useStatsQuery< StatsLatestPostResponse >(
		statsLatestPostQuery(),
		options
	);
	const latestPost = latestPostResult.data ?? null;
	const postId = latestPost?.id ?? 0;

	// Views live on a separate endpoint; the query only enables once the post ID is known.
	const postViewsResult = useStatsPost( { postId, fields: [ 'views' ] }, options );

	const isLoading = latestPostResult.isLoading || ( postId > 0 && postViewsResult.isLoading );
	const isError = latestPostResult.isError || postViewsResult.isError;

	const post = latestPost ? { ...latestPost, views: postViewsResult.data?.views ?? 0 } : null;

	return { post, isLoading, isError };
}
