/**
 * Internal dependencies
 */
import { statsLatestPostQuery } from '../queries/stats-latest-post-query';
import { safeParseFloat } from '../utils/parsing';
import { useStatsPost } from './use-stats-post';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsLatestPost } from '../processing/stats';
import type { StatsLatestPostResponse } from '../queries/stats-latest-post-query';

export type { StatsLatestPost, StatsLatestPostResponse };

export type StatsLatestPostWithViews = StatsLatestPost & {
	views: number;
	likeCount: number;
	commentCount: number;
};

export type UseStatsLatestPostResult = {
	post: StatsLatestPostWithViews | null;
	isLoading: boolean;
	isError: boolean;
};

/**
 * The site's most recent published post with its all-time views, likes, and
 * comments. The post's content is read locally from core (so it resolves on
 * private sites); its metrics come from the Stats post endpoint in a second,
 * dependent request keyed by the resolved post ID.
 *
 * Only a content failure surfaces as an error: content is the widget. When the
 * Stats request fails (e.g. a private Simple site where stats/post 403s), the
 * post still renders with its metrics zeroed rather than blanking the widget.
 *
 * @param options - Shared stats query options (e.g. `enabled`).
 * @return The latest post with its metrics, plus combined loading/error state.
 */
export function useStatsLatestPost( options?: UseStatsOptions ): UseStatsLatestPostResult {
	const latestPostResult = useStatsQuery< StatsLatestPostResponse >(
		statsLatestPostQuery(),
		options
	);
	const latestPost = latestPostResult.data ?? null;
	const postId = latestPost?.id ?? 0;

	// Metrics live on the Stats post endpoint; the query only enables once the post ID is known.
	const postStatsResult = useStatsPost(
		{ postId, fields: [ 'views', 'like_count', 'post' ] },
		options
	);

	const isLoading = latestPostResult.isLoading || ( postId > 0 && postStatsResult.isLoading );
	const isError = latestPostResult.isError;

	const post = latestPost
		? {
				...latestPost,
				views: postStatsResult.data?.views ?? 0,
				likeCount: postStatsResult.data?.like_count ?? 0,
				commentCount: safeParseFloat( postStatsResult.data?.post?.comment_count ),
		  }
		: null;

	return { post, isLoading, isError };
}
