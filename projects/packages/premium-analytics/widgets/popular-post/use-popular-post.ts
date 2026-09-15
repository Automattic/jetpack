/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	useStatsPost,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { PRESET_LAST_12_MONTHS } from '@jetpack-premium-analytics/datetime';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useAuthorRankedPost, useSiteRankedPost } from './use-ranked-post';

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
 * Only a failure that leaves no winner surfaces as an error; a failing metrics
 * request degrades to unknown counts. See `useSiteRankedPost` and
 * `useAuthorRankedPost` for the two rankings.
 *
 * @param scope - The author scope, when the page has one; omit to rank the whole site.
 * @return The winning post and request state.
 */
export function usePopularPost( scope?: UsePopularPostScope ): UsePopularPostResult {
	const isAuthorScoped = !! scope && scope.authorId > 0;

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
	const rankingParams = useMemo( () => ( { from, to, interval } ), [ from, to, interval ] );

	const siteRanking = useSiteRankedPost( rankingParams, ! isAuthorScoped );
	const authorRanking = useAuthorRankedPost( scope?.authorId ?? 0, rankingParams, isAuthorScoped );
	const ranking = isAuthorScoped ? authorRanking : siteRanking;

	const { topRow, content } = ranking;
	const postId = Number( topRow?.id ?? 0 ) || 0;
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

	// The metrics query is disabled until a post ID resolves, so it only counts
	// towards the loading state once there is a post to load.
	const isLoading =
		ranking.isLoading || ( postId > 0 && ( postStatsResult.isLoading || isMetricsPending ) );
	const isFetching = ranking.isFetching || postStatsResult.isFetching;

	const refetch = () => {
		ranking.refetch();
		// Disabled until a post ID resolves; refetching it then would request post 0.
		if ( postId > 0 ) {
			void postStatsResult.refetch();
		}
	};

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
		// Surfaced even with rows on screen: `placeholderData` only applies while
		// pending, so rows surviving an error mean a failed background refetch.
		isError: ranking.isError,
		error: ranking.error,
		refetch,
	};
}
