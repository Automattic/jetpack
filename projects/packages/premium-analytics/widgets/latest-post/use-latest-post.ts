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
	/** All-time totals from the Stats post endpoint; undefined when unknown. */
	views: number | undefined;
	likeCount: number | undefined;
	commentCount: number | undefined;
};

export type UseLatestPostResult = {
	post: LatestPostWithMetrics | null;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
};

/**
 * The site's most recent published post with its all-time views, likes, and
 * comments. This composition is specific to the Latest post widget: content is
 * read locally from core (so it resolves on private sites), and its metrics come
 * from the Stats post endpoint in a second, dependent request keyed by the
 * resolved post ID.
 *
 * Only a content failure surfaces as an error. When the Stats request fails (a
 * private site 403s it), the post still renders with its metrics unknown.
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
	const isFetching = latestPostResult.isFetching || postStatsResult.isFetching;
	// Surfaced even with a post on screen: `placeholderData` only applies while
	// pending, so a post surviving an error means a failed background refetch.
	const isError = latestPostResult.isError;

	const refetch = () => {
		void latestPostResult.refetch();
		// The stats query is disabled until a post ID resolves; refetching it
		// while disabled would force a request for post 0.
		if ( postId > 0 ) {
			void postStatsResult.refetch();
		}
	};

	const post = latestPost
		? {
				...latestPost,
				// Undefined rather than zeroed, so a 403 cannot read as "Likes 0".
				views: postStatsResult.data?.views,
				likeCount: postStatsResult.data?.like_count,
				commentCount: postStatsResult.data?.post?.comment_count,
		  }
		: null;

	return { post, isLoading, isFetching, isError, refetch };
}
