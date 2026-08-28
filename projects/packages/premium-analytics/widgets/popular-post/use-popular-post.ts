/**
 * External dependencies
 */
import {
	computeDateRangeFromPreset,
	postContentQuery,
	useStatsPost,
	useStatsQuery,
	useStatsTopPosts,
	type LatestPostResponse,
	type ReportPresetId,
} from '@jetpack-premium-analytics/data';
import { PRESET_LAST_12_MONTHS } from '@jetpack-premium-analytics/datetime';
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

/**
 * A ranking window, as report date params. The preset travels with the dates
 * because the detail page recomputes the range from it on arrival.
 */
export type PopularPostRange = {
	preset: ReportPresetId;
	from: string;
	to: string;
};

// The window the card ranks over while it carries no date control of its own.
// Named rather than inlined so giving it one later is a change of caller.
export const POPULAR_POST_DEFAULT_PRESET = PRESET_LAST_12_MONTHS;

/**
 * Resolved per call rather than once, so the window is never older than the
 * render that reads it. `last-12-months` is a built-in preset, so it always
 * resolves; the empty fallback exists only to satisfy the type. It disables the
 * ranking query rather than silently widening the window, which the card would
 * show as its empty state — wrong, but only reachable if the preset itself
 * stopped resolving.
 */
function resolveDefaultRange(): PopularPostRange {
	const range = computeDateRangeFromPreset( POPULAR_POST_DEFAULT_PRESET ) ?? {
		from: '',
		to: '',
	};

	return { preset: POPULAR_POST_DEFAULT_PRESET, ...range };
}

export type UsePopularPostResult = {
	post: PopularPostWithMetrics | null;
	/**
	 * The window the winner was ranked over. The card's detail link opens on it,
	 * so the post's own page reports on the period the card's title names.
	 */
	range: PopularPostRange;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
};

/**
 * The site's most-viewed post of a single window. The window only picks the
 * winner: every displayed metric is an all-time total from `stats/post`, so the
 * three tiles cannot measure different periods.
 *
 * Defaults to the last 12 months — the period the card's title names — rather
 * than the dashboard's range, which would make that title false the moment the
 * section filter moved. `range` overrides it, for the day the card carries a
 * date control of its own (see the widget rules on widgets that host one).
 * Whatever is passed has to be a window the card's title can honestly claim, so
 * it is that control's range, not the section filter's.
 *
 * Only a ranking failure surfaces as an error; a failing content or metrics
 * request degrades to no image and unknown counts.
 *
 * @param range - The window to rank over. Defaults to the last 12 months.
 */
export function usePopularPost( range?: PopularPostRange ): UsePopularPostResult {
	// Down to primitives first, so a caller building the object inline does not
	// re-key the report query on every render.
	const { preset, from, to } = range ?? resolveDefaultRange();

	const activeRange = useMemo( () => ( { preset, from, to } ), [ preset, from, to ] );

	// `interval` never reaches the request — it is not in the stats param
	// allow-list, and the query layer buckets a summarized window by day unless a
	// `period` is forced. It is here because `ReportParams` requires it, and
	// `day` is the value that matches what the report actually does.
	const statsParams = useMemo(
		() => ( { from, to, interval: 'day' as const, max: POPULAR_POST_REQUEST_MAX } ),
		[ from, to ]
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

	return {
		post,
		range: activeRange,
		isLoading,
		isFetching,
		isError,
		error: topPostsResult.error,
		refetch,
	};
}
