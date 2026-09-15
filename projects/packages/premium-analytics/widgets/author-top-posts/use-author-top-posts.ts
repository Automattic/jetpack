/**
 * External dependencies
 */
import { useStatsTopAuthors, type ReportParams } from '@jetpack-premium-analytics/data';
import { sharePercentage } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

export type AuthorTopPostRow = {
	id: string;
	postId?: string | number;
	title: string;
	link: string | null;
	views: number;
	share: number;
};

export interface AuthorTopPostsState {
	rows: AuthorTopPostRow[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	hasData: boolean;
	refetch: () => void;
}

/**
 * The author's posts ranked by views over the report window, read out of the
 * summarized top-authors report; the endpoint already orders them.
 *
 * @param authorId     - The author's user ID; `0` disables the request.
 * @param reportParams - The page's report params.
 * @param maxRows      - How many posts to keep.
 * @return The ranked rows and request state.
 */
export default function useAuthorTopPosts(
	authorId: number,
	reportParams: ReportParams,
	maxRows: number
): AuthorTopPostsState {
	const statsParams = useMemo( () => ( { ...reportParams, max: 0 } ), [ reportParams ] );

	const { primary, comparisonRows, isLoading, isFetching, isError, refetch } = useStatsTopAuthors(
		statsParams,
		{ enabled: authorId > 0 }
	);

	const rows = useMemo( () => {
		const author = comparisonRows?.rows.find( row => String( row.id ) === String( authorId ) );
		const posts = ( author?.children ?? [] ).slice( 0, maxRows );
		const maxValue = Math.max( ...posts.map( post => post.views ), 0 );

		return posts.map( ( post, index ) => ( {
			id: post.id != null ? String( post.id ) : post.link ?? `post-${ index }`,
			postId: post.id ?? undefined,
			title: String( post.label ?? '' ),
			link: post.link ?? null,
			views: post.views,
			share: sharePercentage( post.views, maxValue ),
		} ) );
	}, [ comparisonRows, authorId, maxRows ] );

	return {
		rows,
		isLoading,
		isFetching,
		isError,
		hasData: !! primary.data,
		refetch,
	};
}
