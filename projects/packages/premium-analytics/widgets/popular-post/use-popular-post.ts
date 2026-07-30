/**
 * External dependencies
 */
import {
	postContentQuery,
	useStatsPost,
	useStatsQuery,
	useStatsTopPosts,
	type LatestPostResponse,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { useMemo } from 'react';

// Only regular posts qualify as a "Popular post": the Stats top-posts report
// also ranks pages and the URL-less homepage entry. Declared at module level so
// the reference stays stable — `useStatsTopPosts` memoizes its comparison mapper
// on this option.
const POPULAR_POST_TYPES = [ 'post' ];

// The API caps the ranked rows it returns at `max`, so ask for a page of them:
// filtering down to post-type rows still needs a winner to pick.
const POPULAR_POST_REQUEST_MAX = 20;

export type PopularPostWithMetrics = {
	id: number;
	title: string;
	url: string;
	/**
	 * The post's publish timestamp.
	 */
	date: string;
	imageUrl: string;
	imageAlt: string;
	/**
	 * Views in the dashboard's selected date range.
	 */
	views: number;
	/**
	 * All-time likes. The Stats post endpoint takes no date range, so this is a
	 * lifetime total even though `views` above is period-scoped.
	 */
	likeCount: number;
	/**
	 * All-time comments, read from the post row on the Stats post endpoint — also
	 * a lifetime total.
	 */
	commentCount: number;
};

export type UsePopularPostResult = {
	post: PopularPostWithMetrics | null;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
};

/**
 * The site's most-viewed post for the dashboard's selected date range, with the
 * metrics a single-post highlight card shows.
 *
 * Three requests compose the card, mirroring `useLatestPost`'s split:
 *
 * 1. `stats/top-posts` for the period ranking — this is the widget's report, so
 *    its date range comes from `reportParams` and its `views` are period-scoped.
 * 2. the local core posts endpoint for the winning post's content, because the
 *    report carries no featured image (and reading content on-site keeps it
 *    resolvable on private/unlaunched sites).
 * 3. `stats/post/{id}` for likes and comments. That endpoint has no date range,
 *    so both are **all-time** totals; the widget labels them as such.
 *
 * Only a report failure surfaces as an error — the ranking is the widget. A
 * failing content or metrics request degrades to no image and zeroed engagement
 * counts rather than blanking the card.
 *
 * @param reportParams - The dashboard's report params (date range, comparison).
 * @return The popular post with its metrics, plus combined loading/error state.
 */
export function usePopularPost( reportParams: ReportParams ): UsePopularPostResult {
	const statsParams = useMemo(
		() => ( { ...reportParams, max: POPULAR_POST_REQUEST_MAX } ),
		[ reportParams ]
	);

	// Ranking, post-type filtering, and the single-row cap all live in the data
	// layer's merge helper (see AGENTS.md), so the widget just takes the winner.
	const topPostsResult = useStatsTopPosts( statsParams, {
		maxRows: 1,
		postTypes: POPULAR_POST_TYPES,
	} );
	const topRow = topPostsResult.comparisonRows?.rows[ 0 ];
	const postId = Number( topRow?.id ?? 0 ) || 0;

	const contentResult = useStatsQuery< LatestPostResponse >( postContentQuery( postId ) );
	const postStatsResult = useStatsPost( { postId, fields: [ 'like_count', 'post' ] } );

	// Both dependent queries are disabled until a post ID resolves, so they only
	// count towards the widget's loading state once there is a post to load.
	const isLoading =
		topPostsResult.isLoading ||
		( postId > 0 && ( contentResult.isLoading || postStatsResult.isLoading ) );
	const isFetching =
		topPostsResult.isFetching || contentResult.isFetching || postStatsResult.isFetching;
	// The Stats queries keep the previous range's rows via `placeholderData`, so a
	// failed range change keeps the post visible; only surface the error when there
	// is nothing to show.
	const isError = topPostsResult.isError && ! topRow;

	const refetch = () => {
		void topPostsResult.refetch();
		// The dependent queries are disabled until a post ID resolves; refetching
		// them while disabled would force a request for post 0.
		if ( postId > 0 ) {
			void contentResult.refetch();
			void postStatsResult.refetch();
		}
	};

	const content = contentResult.data ?? null;
	const post = topRow
		? {
				id: postId,
				// The report row is the fallback for the fields core also returns: its
				// title comes from WPCOM and can lag a rename, and it is not entity-decoded.
				title: content?.title || String( topRow.label ?? '' ),
				url: content?.url || topRow.link || '',
				date: content?.date || ( typeof topRow.date === 'string' ? topRow.date : '' ),
				imageUrl: content?.imageUrl ?? '',
				imageAlt: content?.imageAlt ?? '',
				views: topRow.views,
				likeCount: postStatsResult.data?.like_count ?? 0,
				commentCount: Number( postStatsResult.data?.post?.comment_count ) || 0,
		  }
		: null;

	return { post, isLoading, isFetching, isError, error: topPostsResult.error, refetch };
}
