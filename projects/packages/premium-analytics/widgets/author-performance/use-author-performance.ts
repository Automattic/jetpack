/**
 * External dependencies
 */
import {
	findAuthorRow,
	useStatsTopAuthors,
	type ReportParams,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { useMemo } from '@wordpress/element';

/**
 * One chart point: a bucket-start date and the author's views in the bucket.
 */
export type AuthorPerformancePoint = {
	date: Date;
	value: number;
};

export interface AuthorPerformanceState {
	current: AuthorPerformancePoint[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	hasData: boolean;
	refetch: () => void;
}

/**
 * Fetch the author's views per chart bucket over the report window. The endpoint
 * has no author filter, so the author is read out of each bucket's ranking and
 * counts as zero where absent (see `useStatsTopAuthors` for the ranking cap).
 *
 * @param authorId     - The author's user ID; `0` disables the request.
 * @param reportParams - The page's report params.
 * @param period       - The chart bucket the endpoint groups by.
 * @return The view series and request state.
 */
export default function useAuthorPerformance(
	authorId: number,
	reportParams: ReportParams,
	period: StatsChartBucketPeriod
): AuthorPerformanceState {
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
				const author = findAuthorRow( point.items, authorId );

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
