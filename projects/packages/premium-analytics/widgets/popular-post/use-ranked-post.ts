/**
 * External dependencies
 */
import {
	postContentQuery,
	postsContentQuery,
	useStatsQuery,
	useStatsTopAuthors,
	useStatsTopPosts,
	type LatestPost,
	type LatestPostResponse,
	type ReportParams,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import { useMemo } from 'react';

/** The window a ranking request covers; `interval` rides along for the params type. */
export type RankingParams = Pick< ReportParams, 'from' | 'to' | 'interval' >;

export type RankedPost = {
	/** The winning report row, once the ranking resolves. */
	topRow: StatsTopPostsItem | undefined;
	/** The winner's headline content from core, once it resolves. */
	content: LatestPost | null;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
};

// Only regular posts qualify as a "Popular post": the Stats top-posts report
// also ranks pages and the URL-less homepage entry. Declared at module level so
// the reference stays stable — `useStatsTopPosts` memoizes its comparison mapper
// on this option.
const POPULAR_POST_TYPES = [ 'post' ];

// Ask for a page of ranked rows, since filtering to post-type rows still needs a
// winner. On a page-heavy site all 20 can be pages, leaving the widget empty
// while a qualifying post ranks lower; only a `post_type`-filtered endpoint fixes that.
const POPULAR_POST_REQUEST_MAX = 20;

/**
 * The site's most-viewed post over the window: `stats/top-posts` picks it, then
 * core supplies its content in a dependent request.
 *
 * @param params  - The ranking window.
 * @param enabled - Whether to rank at all.
 * @return The winner and request state.
 */
export function useSiteRankedPost( params: RankingParams, enabled: boolean ): RankedPost {
	const statsParams = useMemo( () => ( { ...params, max: POPULAR_POST_REQUEST_MAX } ), [ params ] );
	// Ranking, post-type filtering, and the single-row cap all live in the data
	// layer's merge helper (see AGENTS.md), so this just takes the winner.
	const ranking = useStatsTopPosts( statsParams, {
		maxRows: 1,
		postTypes: POPULAR_POST_TYPES,
		enabled,
	} );
	const topRow = enabled ? ranking.comparisonRows?.rows[ 0 ] : undefined;
	const postId = Number( topRow?.id ?? 0 ) || 0;
	const contentResult = useStatsQuery< LatestPostResponse >( postContentQuery( postId ) );

	return {
		topRow,
		content: contentResult.data ?? null,
		isLoading: ranking.isLoading || ( postId > 0 && contentResult.isLoading ),
		isFetching: ranking.isFetching || contentResult.isFetching,
		isError: ranking.isError,
		error: ranking.error,
		refetch: () => {
			void ranking.refetch();
			// Disabled until a post ID resolves; refetching it then would request post 0.
			if ( postId > 0 ) {
				void contentResult.refetch();
			}
		},
	};
}

/**
 * One author's most-viewed post over the window, out of `stats/top-authors`.
 * The author's ranked rows carry no post type, so the pick waits for core to
 * say which of them are posts (pages rank there too); that shortlist request
 * doubles as the winner's content.
 *
 * @param authorId - The author's user ID.
 * @param params   - The ranking window.
 * @param enabled  - Whether to rank at all.
 * @return The winner and request state.
 */
export function useAuthorRankedPost(
	authorId: number,
	params: RankingParams,
	enabled: boolean
): RankedPost {
	const statsParams = useMemo( () => ( { ...params, max: 0 } ), [ params ] );
	const ranking = useStatsTopAuthors( statsParams, { enabled } );

	const rows = useMemo( () => {
		if ( ! enabled ) {
			return [];
		}
		const author = ranking.comparisonRows?.rows.find(
			row => String( row.id ) === String( authorId )
		);

		return author?.children ?? [];
	}, [ enabled, ranking.comparisonRows, authorId ] );
	const candidateIds = useMemo(
		() => rows.map( row => Number( row.id ) || 0 ).filter( Boolean ),
		[ rows ]
	);
	const contentResult = useStatsQuery< LatestPost[] >( postsContentQuery( candidateIds ) );

	const topRow = useMemo( () => {
		const posts = new Set( ( contentResult.data ?? [] ).map( item => item.id ) );

		return rows.find( row => posts.has( Number( row.id ) ) );
	}, [ rows, contentResult.data ] );
	const postId = Number( topRow?.id ?? 0 ) || 0;

	// The shortlist decides the winner, so its failure would otherwise read as
	// "no views" rather than as an error.
	const hasCandidates = candidateIds.length > 0;
	const isShortlistError = hasCandidates && contentResult.isError;

	return {
		topRow,
		content: contentResult.data?.find( item => item.id === postId ) ?? null,
		isLoading: ranking.isLoading || ( hasCandidates && contentResult.isLoading ),
		isFetching: ranking.isFetching || contentResult.isFetching,
		isError: ranking.isError || isShortlistError,
		error: ranking.error ?? ( isShortlistError ? contentResult.error : null ),
		refetch: () => {
			void ranking.refetch();
			if ( hasCandidates ) {
				void contentResult.refetch();
			}
		},
	};
}
