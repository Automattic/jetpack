/**
 * External dependencies
 */
import {
	useStatsAuthor,
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

	const current = useMemo(
		() =>
			( data?.data ?? [] ).flatMap( point => {
				const date = parseSiteDateTime( point.period );

				return date ? [ { date, value: point.views } ] : [];
			} ),
		[ data ]
	);

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
