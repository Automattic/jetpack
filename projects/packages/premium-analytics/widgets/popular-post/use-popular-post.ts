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

// Ask for a page of ranked rows, since filtering to post-type rows still needs a
// winner. On a page-heavy site all 20 can be pages, leaving the widget empty
// while a qualifying post ranks lower; only a `post_type`-filtered endpoint fixes that.
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
	/** All-time totals from the Stats post endpoint; undefined when unknown. */
	views: number | undefined;
	likeCount: number | undefined;
	commentCount: number | undefined;
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
 * The site's most-viewed post for the selected date range. The range only picks
 * the winner: every displayed metric is an all-time total from `stats/post`, so
 * the three tiles cannot measure different periods.
 *
 * Only a ranking failure surfaces as an error; a failing content or metrics
 * request degrades to no image and unknown counts.
 *
 * @param reportParams - The dashboard's report params (date range, comparison).
 * @return The popular post with its metrics, plus combined loading/error state.
 */
export function usePopularPost( reportParams: ReportParams ): UsePopularPostResult {
	const statsParams = useMemo( () => {
		// Comparison params would fetch a second report this widget never renders.
		const primaryParams = { ...reportParams, max: POPULAR_POST_REQUEST_MAX };
		delete primaryParams.comp;
		delete primaryParams.compare_from;
		delete primaryParams.compare_to;
		delete primaryParams.compare_preset;

		return primaryParams;
	}, [ reportParams ] );

	// Ranking, post-type filtering, and the single-row cap all live in the data
	// layer's merge helper (see AGENTS.md), so the widget just takes the winner.
	const topPostsResult = useStatsTopPosts( statsParams, {
		maxRows: 1,
		postTypes: POPULAR_POST_TYPES,
	} );
	const topRow = topPostsResult.comparisonRows?.rows[ 0 ];
	const postId = Number( topRow?.id ?? 0 ) || 0;

	const contentResult = useStatsQuery< LatestPostResponse >( postContentQuery( postId ) );
	const postStatsResult = useStatsPost( { postId, fields: [ 'views', 'like_count', 'post' ] } );

	/*
	 * Only consume metrics the response attributes to the current post: the Stats
	 * query keeps the previous key's payload via `placeholderData` while the
	 * content query does not, so a winner change could pair a new title with old
	 * engagement. A response without an identifier is trusted, since there is
	 * nothing to match on and skeletoning forever would be worse.
	 */
	const statsPostData = postStatsResult.data;
	const statsPostId = statsPostData?.post?.ID;
	const metrics =
		statsPostData && ( statsPostId === undefined || statsPostId === postId )
			? statsPostData
			: undefined;

	// A failed request stops counting as pending, or a 403 would skeleton forever.
	const isMetricsPending = postId > 0 && ! metrics && ! postStatsResult.isError;

	// Both dependent queries are disabled until a post ID resolves, so they only
	// count towards the widget's loading state once there is a post to load.
	const isLoading =
		topPostsResult.isLoading ||
		( postId > 0 && ( contentResult.isLoading || postStatsResult.isLoading || isMetricsPending ) );
	const isFetching =
		topPostsResult.isFetching || contentResult.isFetching || postStatsResult.isFetching;
	// Surfaced even with rows on screen: `placeholderData` only applies while
	// pending, so rows surviving an error mean a failed background refetch.
	const isError = topPostsResult.isError;

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
				// Undefined rather than zeroed, so a 403 cannot read as "Likes 0".
				views: metrics?.views,
				likeCount: metrics?.like_count,
				commentCount: metrics?.post?.comment_count,
		  }
		: null;

	return { post, isLoading, isFetching, isError, error: topPostsResult.error, refetch };
}
