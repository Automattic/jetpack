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

/**
 * The Stats post row reports `comment_count` as either a string or a number.
 * An absent count stays absent, so it can render as "not available" instead of
 * being flattened into a real zero.
 *
 * @param value - The raw `comment_count` from the Stats post row.
 * @return The parsed count, or undefined when the row carries none.
 */
function toCommentCount( value: string | number | undefined ): number | undefined {
	return value === undefined ? undefined : Number( value ) || 0;
}

export type LatestPostWithMetrics = LatestPost & {
	/**
	 * All-time metrics from the Stats post endpoint. Undefined when that request
	 * failed, so the card can distinguish "unknown" from a genuine zero.
	 */
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
 * Only a content failure surfaces as an error — content is the widget. When the
 * Stats request fails (e.g. a private Simple site where stats/post 403s), the
 * post still renders, with its metrics marked unavailable rather than zeroed and
 * rather than blanking the widget.
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
	/*
	 * Surface a content failure even when a post is still on screen. `placeholderData`
	 * only applies while a query is pending, so a post that survives an error is
	 * React Query's last successful data — a failed background refetch. Gating the
	 * error on `! latestPost` hid exactly that case: stale content, no error, no Retry.
	 */
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
				// Left undefined rather than zeroed when the metrics request fails, so
				// the card shows a dash instead of claiming zero likes.
				views: postStatsResult.data?.views,
				likeCount: postStatsResult.data?.like_count,
				commentCount: toCommentCount( postStatsResult.data?.post?.comment_count ),
		  }
		: null;

	return { post, isLoading, isFetching, isError, refetch };
}
