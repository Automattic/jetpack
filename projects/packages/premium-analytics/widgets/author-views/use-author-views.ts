/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
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
	hasData: boolean;
	refetch: () => void;
}

/**
 * Fetch the author's daily views over the report window and sum them into the
 * chart's buckets client-side, like the other Stats charts: the endpoint keys a
 * week or month bucket at its calendar start, which the report normalizer would
 * drop as before the window. A day without this author counts as zero; see
 * `useStatsTopAuthors` for the ranking cap behind that.
 *
 * @param authorId     - The author's user ID; `0` disables the request.
 * @param reportParams - The page's report params.
 * @param period       - The chart bucket to sum the days into.
 * @return The view series and request state.
 */
export default function useAuthorViews(
	authorId: number,
	reportParams: ReportParams,
	period: StatsChartBucketPeriod
): AuthorViewsState {
	const statsParams = useMemo(
		() => ( { ...reportParams, period: 'day', summarize: 0, max: 0 } ),
		[ reportParams ]
	);

	const { primary, isLoading, isFetching, isError, refetch } = useStatsTopAuthors( statsParams, {
		enabled: authorId > 0,
	} );

	const current = useMemo( () => {
		const bucketed = bucketStatsTimeSeries( primary.data, period, point => {
			const author = point.items.find( item => String( item.id ) === String( authorId ) );

			return { value: author?.views ?? 0 };
		} );

		return bucketed.data
			.flatMap( point => {
				const date = parseSiteDateTime( point.time_interval );

				return date ? [ { date, value: Number( point.value ?? 0 ) } ] : [];
			} )
			.sort( ( a, b ) => a.date.getTime() - b.date.getTime() );
	}, [ primary.data, authorId, period ] );

	return {
		current,
		isLoading,
		isFetching,
		isError,
		hasData: !! primary.data,
		refetch,
	};
}
