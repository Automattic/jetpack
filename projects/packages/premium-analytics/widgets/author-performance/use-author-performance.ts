/**
 * External dependencies
 */
import {
	useStatsAuthor,
	type ReportParams,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { clipBucketToRange, parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { toDayRange } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * One chart point: the first and last day of the bucket that fall in the range,
 * and the author's views in it.
 */
export type AuthorPerformancePoint = {
	date: Date;
	endDate?: Date;
	value: number;
};

export interface AuthorPerformanceState {
	current: AuthorPerformancePoint[];
	views: number;
	/** Window totals; `null` until loaded or when the endpoint has none. */
	likes: number | null;
	comments: number | null;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	hasData: boolean;
	refetch: () => void;
}

/**
 * Fetch the author's views per chart bucket, and their likes and comments, over
 * the report window.
 *
 * @param authorId     - The author's user ID; `0` disables the request.
 * @param reportParams - The page's report params.
 * @param period       - The chart bucket the endpoint groups by.
 * @return The view series, the window totals and request state.
 */
export default function useAuthorPerformance(
	authorId: number,
	reportParams: ReportParams,
	period: StatsChartBucketPeriod
): AuthorPerformanceState {
	const params = useMemo(
		() => ( { from: reportParams.from, to: reportParams.to, period } ),
		[ reportParams.from, reportParams.to, period ]
	);

	const { data, isLoading, isFetching, isError, error, refetch } = useStatsAuthor(
		authorId,
		params
	);

	const current = useMemo( () => {
		const range = toDayRange( reportParams.from, reportParams.to );

		return ( data?.data ?? [] ).flatMap( point => {
			const start = parseSiteDateTime( point.period );
			if ( ! start ) {
				return [];
			}

			const bounds = range && clipBucketToRange( point.period, period, range );
			const date = parseSiteDateTime( bounds?.from ) ?? start;
			const endDate = parseSiteDateTime( bounds?.to );
			const value = point.views;

			return [ endDate ? { date, endDate, value } : { date, value } ];
		} );
	}, [ data, period, reportParams.from, reportParams.to ] );

	return {
		current,
		views: data?.views ?? 0,
		likes: data?.likes ?? null,
		comments: data?.comments ?? null,
		isLoading,
		isFetching,
		isError,
		error,
		hasData: !! data,
		refetch,
	};
}
