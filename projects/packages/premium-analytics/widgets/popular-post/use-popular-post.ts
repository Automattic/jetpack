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
//
// Trade-off: on a page-heavy site the top 20 ranked rows can all be pages, and
// the widget then shows its empty state even though a qualifying post ranks
// lower. Raising this only moves the boundary rather than removing it; a
// `post_type`-filtered top-posts endpoint would, and would also let the ranking
// and the metrics come from one window.
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
	 * All-time views, read from the Stats post endpoint.
	 */
	views: number;
	/**
	 * All-time likes, read from the Stats post endpoint.
	 */
	likeCount: number;
	/**
	 * All-time comments, read from the post row on the Stats post endpoint.
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
 * 1. `stats/top-posts` for the period ranking. The date range's only job is to
 *    pick the winner; the row's period views are not what the card displays.
 * 2. the local core posts endpoint for the winning post's content, because the
 *    report carries no featured image (and reading content on-site keeps it
 *    resolvable on private/unlaunched sites).
 * 3. `stats/post/{id}` for every displayed metric — views, likes and comments.
 *
 * All three tiles therefore share one window: **all-time**. The Stats post
 * endpoint takes no date range, so likes and comments can only be lifetime
 * totals; reading views from the same response keeps three tiles that sit side
 * by side from silently measuring two different periods. It also matches the
 * sibling `Latest post` widget, which shares this card and is already all-time.
 *
 * Only a report failure surfaces as an error — the ranking is the widget. A
 * failing content or metrics request degrades to no image and zeroed counts
 * rather than blanking the card.
 *
 * @param reportParams - The dashboard's report params (date range, comparison).
 * @return The popular post with its metrics, plus combined loading/error state.
 */
export function usePopularPost( reportParams: ReportParams ): UsePopularPostResult {
	const statsParams = useMemo( () => {
		/*
		 * The comparison window drives a second `stats/top-posts` request, but this
		 * widget renders a single winner and no period-over-period delta anywhere,
		 * so that response would be fetched and discarded. Drop the comparison
		 * fields, the way `video-detail-highlights` does for params its endpoint
		 * cannot use.
		 */
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
	 * `statsProxyQuery` carries the previous key's payload over through
	 * `placeholderData`, while the content query deliberately does not. On a
	 * winner change that pairing would render the new post's title beside the
	 * previous post's engagement until the dependent request resolves.
	 *
	 * So consume metrics only from a response that identifies the post we asked
	 * for. When the endpoint omits the identifier there is nothing to match on,
	 * and holding the card in a skeleton forever would be worse than trusting it.
	 */
	const statsPostData = postStatsResult.data;
	const statsPostId = statsPostData?.post?.ID;
	const metrics =
		statsPostData && ( statsPostId === undefined || statsPostId === postId )
			? statsPostData
			: undefined;

	// A failed metrics request degrades to zeroed counts, so it stops counting as
	// pending — otherwise the card would skeleton indefinitely on a 403.
	const isMetricsPending = postId > 0 && ! metrics && ! postStatsResult.isError;

	// Both dependent queries are disabled until a post ID resolves, so they only
	// count towards the widget's loading state once there is a post to load.
	const isLoading =
		topPostsResult.isLoading ||
		( postId > 0 && ( contentResult.isLoading || postStatsResult.isLoading || isMetricsPending ) );
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
				views: metrics?.views ?? 0,
				likeCount: metrics?.like_count ?? 0,
				commentCount: Number( metrics?.post?.comment_count ) || 0,
		  }
		: null;

	return { post, isLoading, isFetching, isError, error: topPostsResult.error, refetch };
}
