/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	postContentQuery,
	postsContentQuery,
	useStatsPost,
	useStatsQuery,
	useStatsTopAuthors,
	useStatsTopPosts,
	type LatestPost,
	type LatestPostResponse,
	type ReportParams,
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
 * The window the card ranked over, as the date fields of the shared report
 * params — the shape the detail page's route takes.
 */
export type PopularPostRange = Pick< ReportParams, 'from' | 'to' | 'preset' | 'interval' >;

// The window the card ranks over, pinned to the period its title names rather
// than following the dashboard's range, which would make that title false the
// moment the section filter moved.
const POPULAR_POST_PRESET = PRESET_LAST_12_MONTHS;

/**
 * Rank one author's posts instead of the site's. The window is then the page's
 * `reportParams` rather than the pinned 12 months.
 */
export type UsePopularPostScope = {
	authorId: number;
	reportParams: ReportParams;
};

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
 * The most-viewed post: the site's over the last 12 months, or one author's over
 * the page's range when scoped to an author. The window only picks the winner:
 * every displayed metric is an all-time total from `stats/post`, so the three
 * tiles cannot measure different periods.
 *
 * Only a ranking failure surfaces as an error; a failing content or metrics
 * request degrades to no image and unknown counts.
 *
 * @param scope - The author scope, when the page has one; omit to rank the whole site.
 * @return The winning post and request state.
 */
export function usePopularPost( scope?: UsePopularPostScope ): UsePopularPostResult {
	const isAuthorScoped = !! scope && scope.authorId > 0;
	const authorId = scope?.authorId ?? 0;

	// Resolved per render rather than once at module load, so the window is never
	// older than the render that reads it.
	const { preset, from, to, interval } = isAuthorScoped
		? scope.reportParams
		: getDefaultQueryParams( false, POPULAR_POST_PRESET );

	const range = useMemo( () => ( { preset, from, to, interval } ), [ preset, from, to, interval ] );

	// `interval` rides along because the params type requires it; it describes the
	// destination's chart, not this request. It cannot reach the API either way:
	// the param mapper does derive a `period` from it, but the query layer
	// overwrites that with `day` for any window carrying no explicit `period`, and
	// `interval` itself is absent from the stats param allow-list and the key.
	const statsParams = useMemo(
		() => ( { from, to, interval, max: POPULAR_POST_REQUEST_MAX } ),
		[ from, to, interval ]
	);

	// Ranking, post-type filtering, and the single-row cap all live in the data
	// layer's merge helper (see AGENTS.md), so the widget just takes the winner.
	const topPostsResult = useStatsTopPosts( statsParams, {
		maxRows: 1,
		postTypes: POPULAR_POST_TYPES,
		enabled: ! isAuthorScoped,
	} );

	const authorStatsParams = useMemo(
		() => ( { from, to, interval, max: 0 } ),
		[ from, to, interval ]
	);
	const topAuthorsResult = useStatsTopAuthors( authorStatsParams, { enabled: isAuthorScoped } );
	// The author's ranked posts. The rows carry no post type, so the pick waits
	// for core to say which of them are posts (pages rank here too).
	const authorRows = useMemo( () => {
		if ( ! isAuthorScoped ) {
			return [];
		}
		const author = topAuthorsResult.comparisonRows?.rows.find(
			row => String( row.id ) === String( authorId )
		);

		return author?.children ?? [];
	}, [ isAuthorScoped, topAuthorsResult.comparisonRows, authorId ] );
	const authorCandidateIds = useMemo(
		() => authorRows.map( row => Number( row.id ) || 0 ).filter( Boolean ),
		[ authorRows ]
	);
	const authorContentResult = useStatsQuery< LatestPost[] >(
		postsContentQuery( authorCandidateIds )
	);
	const authorTopRow = useMemo( () => {
		const posts = new Set( ( authorContentResult.data ?? [] ).map( item => item.id ) );

		return authorRows.find( row => posts.has( Number( row.id ) ) );
	}, [ authorRows, authorContentResult.data ] );

	const rankingResult = isAuthorScoped ? topAuthorsResult : topPostsResult;
	const topRow = isAuthorScoped ? authorTopRow : topPostsResult.comparisonRows?.rows[ 0 ];
	const postId = Number( topRow?.id ?? 0 ) || 0;

	// Site-wide, the winner's content is a dependent request; author-scoped, it
	// already arrived with the shortlist.
	const siteContentResult = useStatsQuery< LatestPostResponse >(
		postContentQuery( isAuthorScoped ? 0 : postId )
	);
	const contentResult = isAuthorScoped ? authorContentResult : siteContentResult;
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
		rankingResult.isLoading ||
		( isAuthorScoped && authorCandidateIds.length > 0 && authorContentResult.isLoading ) ||
		( postId > 0 && ( contentResult.isLoading || postStatsResult.isLoading || isMetricsPending ) );
	const isFetching =
		rankingResult.isFetching || contentResult.isFetching || postStatsResult.isFetching;
	// Surfaced even with rows on screen: `placeholderData` only applies while
	// pending, so rows surviving an error mean a failed background refetch.
	const isError = rankingResult.isError;

	const refetch = () => {
		void rankingResult.refetch();
		// The dependent queries are disabled until a post ID resolves; refetching
		// them while disabled would force a request for post 0.
		if ( postId > 0 ) {
			void contentResult.refetch();
			void postStatsResult.refetch();
		}
	};

	const content = isAuthorScoped
		? authorContentResult.data?.find( item => item.id === postId ) ?? null
		: siteContentResult.data ?? null;
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
		range,
		isLoading,
		isFetching,
		isError,
		error: rankingResult.error,
		refetch,
	};
}
