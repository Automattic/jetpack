/**
 * External dependencies
 */
import {
	useStatsAuthor,
	type ReportParams,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { getDateIntervalDateParts, parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { toDay } from '@jetpack-premium-analytics/widgets-toolkit';
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

/**
 * The days of a bucket that fall in the range, so the tooltip names a month the
 * range cuts by its days.
 *
 * @param start  - The bucket's first calendar day, `yyyy-MM-dd`.
 * @param period - The bucket size.
 * @param from   - The range's first day, `yyyy-MM-dd`.
 * @param to     - The range's last day, `yyyy-MM-dd`.
 * @return The bucket's clipped first and last day.
 */
function clipBucketToRange(
	start: string,
	period: StatsChartBucketPeriod,
	from: string,
	to: string
) {
	const { endDate: end } = getDateIntervalDateParts( start, period );

	return { from: start < from ? from : start, to: end > to ? to : end };
}

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
		const from = toDay( reportParams.from );
		const to = toDay( reportParams.to );

		return ( data?.data ?? [] ).flatMap( point => {
			const start = parseSiteDateTime( point.period );
			if ( ! start ) {
				return [];
			}

			const bounds = from && to ? clipBucketToRange( point.period, period, from, to ) : undefined;
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
