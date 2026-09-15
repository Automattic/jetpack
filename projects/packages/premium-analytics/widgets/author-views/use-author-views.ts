/**
 * External dependencies
 */
import {
	useStatsTopAuthors,
	type ReportParams,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { useMemo } from '@wordpress/element';

/**
 * One chart point: a bucket-start date and the author's views in the bucket.
 */
export type AuthorViewsPoint = {
	date: Date;
	value: number;
};

export interface AuthorViewsState {
	current: AuthorViewsPoint[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	hasData: boolean;
	refetch: () => void;
}

/**
 * Fetch the author's views per chart bucket over the report window.
 * `stats/top-authors` has no author filter, so every bucket carries every
 * ranked author and this one is read out of each; a bucket without the author
 * counts as zero (see `useStatsTopAuthors` for the ranking cap behind that).
 *
 * @param authorId     - The author's user ID; `0` disables the request.
 * @param reportParams - The page's report params.
 * @param period       - The chart bucket the endpoint groups by.
 * @return The view series and request state.
 */
export default function useAuthorViews(
	authorId: number,
	reportParams: ReportParams,
	period: StatsChartBucketPeriod
): AuthorViewsState {
	const statsParams = useMemo(
		() => ( { ...reportParams, period, summarize: 0, max: 0 } ),
		[ reportParams, period ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsTopAuthors(
		statsParams,
		{ enabled: authorId > 0 }
	);

	const current = useMemo( () => {
		const points = primary.data?.data ?? [];

		return points
			.flatMap( point => {
				const date = parseSiteDateTime( point.time_interval );
				if ( ! date ) {
					return [];
				}
				const author = point.items.find( item => String( item.id ) === String( authorId ) );

				return [ { date, value: author?.views ?? 0 } ];
			} )
			.sort( ( a, b ) => a.date.getTime() - b.date.getTime() );
	}, [ primary.data, authorId ] );

	return {
		current,
		isLoading,
		isFetching,
		isError,
		error,
		hasData: !! primary.data,
		refetch,
	};
}
