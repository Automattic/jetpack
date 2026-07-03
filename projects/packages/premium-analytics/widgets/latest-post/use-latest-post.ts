/**
 * Internal dependencies
 */
import {
	latestPostQuery,
	useStatsPost,
	useStatsQuery,
	type LatestPost,
	type LatestPostResponse,
} from '@jetpack-premium-analytics/data';

export type LatestPostWithMetrics = LatestPost & {
	views: number;
	likeCount: number;
	commentCount: number;
};

export type UseLatestPostResult = {
	post: LatestPostWithMetrics | null;
	isLoading: boolean;
	isError: boolean;
};

/**
 * The site's most recent published post with its all-time views, likes, and
 * comments. This composition is specific to the Latest post widget: content is
 * read locally from core (so it resolves on private sites), and its metrics come
 * from the Stats post endpoint in a second, dependent request keyed by the
 * resolved post ID.
 *
 * Only a content failure surfaces as an error — content is the widget. When the
 * Stats request fails (e.g. a private Simple site where stats/post 403s), the
 * post still renders with its metrics zeroed rather than blanking the widget.
 *
 * @return The latest post with its metrics, plus combined loading/error state.
 */
export function useLatestPost(): UseLatestPostResult {
	const latestPostResult = useStatsQuery< LatestPostResponse >( latestPostQuery() );
	const latestPost = latestPostResult.data ?? null;
	const postId = latestPost?.id ?? 0;

	// Metrics live on the Stats post endpoint; the query only enables once the post ID is known.
	const postStatsResult = useStatsPost( { postId, fields: [ 'views', 'like_count', 'post' ] } );

	const isLoading = latestPostResult.isLoading || ( postId > 0 && postStatsResult.isLoading );
	const isError = latestPostResult.isError;

	const post = latestPost
		? {
				...latestPost,
				views: postStatsResult.data?.views ?? 0,
				likeCount: postStatsResult.data?.like_count ?? 0,
				commentCount: Number( postStatsResult.data?.post?.comment_count ) || 0,
		  }
		: null;

	return { post, isLoading, isError };
}
