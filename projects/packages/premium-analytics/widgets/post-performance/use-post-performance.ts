/**
 * External dependencies
 */
import {
	localTZDate,
	useStatsPost,
	type ReportParams,
	type StatsPostDay,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	eachDayOfInterval,
	eachMonthOfInterval,
	eachWeekOfInterval,
	format,
	parseISO,
	startOfISOWeek,
	startOfMonth,
} from 'date-fns';
/**
 * Internal dependencies
 */
import type { PostPerformanceGranularity } from './widget';
import type { MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Selectable bucket sizes.
 */
export type PostPerformancePeriod = PostPerformanceGranularity;

/**
 * Normalized Performance state: one tab per metric plus the request's
 * load/error flags. `hasData` distinguishes the first load from refetches.
 */
export interface PostPerformanceState {
	metrics: MetricTab[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	hasData: boolean;
	refetch: () => void;
}

/**
 * A date-only window sliced from the dashboard report params.
 */
type DayWindow = {
	from: string;
	to: string;
};

/**
 * Extract a validated `YYYY-MM-DD` day from an ISO report param. The report
 * params originate from URL search params, so the shape and calendar validity
 * are both checked — `bucketDays()` feeds these to `parseISO()`/
 * `each*OfInterval()`, which throw on invalid dates.
 *
 * @param value - The ISO date-time string.
 * @return The date-only day, or undefined when missing/malformed.
 */
function toValidDay( value?: string ): string | undefined {
	const day = value?.slice( 0, 10 );

	if ( ! day || ! /^\d{4}-\d{2}-\d{2}$/.test( day ) || Number.isNaN( parseISO( day ).getTime() ) ) {
		return undefined;
	}

	return day;
}

/**
 * Extract a `YYYY-MM-DD` window from ISO report params, or undefined when
 * either bound is missing/malformed. The endpoint's day keys are date-only,
 * so comparing date prefixes keeps the slice timezone-stable.
 *
 * @param from - The window's ISO start.
 * @param to   - The window's ISO end.
 * @return The date-only window.
 */
function toDayWindow( from?: string, to?: string ): DayWindow | undefined {
	const fromDay = toValidDay( from );
	const toDay = toValidDay( to );

	if ( ! fromDay || ! toDay ) {
		return undefined;
	}

	return { from: fromDay, to: toDay };
}

/**
 * Bucket the post's daily view history into chart points for a window: day
 * buckets pass through, week/month buckets sum into their period start. The
 * window is clamped to the history's actual span, then every calendar bucket
 * inside it is zero-seeded before summing — the endpoint may omit zero-view
 * days, and the chart's comparison overlay aligns series by index, so both
 * windows must always yield one point per bucket. The full history is
 * bucketed client-side because the endpoint's `weeks` field only covers a
 * fixed recent window.
 *
 * @param days   - The post's daily views, oldest first.
 * @param window - The date-only window to keep.
 * @param period - The bucket size.
 * @return One point per calendar bucket, oldest first.
 */
function bucketDays( days: StatsPostDay[], window: DayWindow, period: PostPerformancePeriod ) {
	if ( ! days.length ) {
		return [];
	}

	const from = window.from > days[ 0 ].date ? window.from : days[ 0 ].date;
	const to = window.to < days[ days.length - 1 ].date ? window.to : days[ days.length - 1 ].date;

	if ( from > to ) {
		return [];
	}

	const bucketKey = ( date: string ): string => {
		if ( period === 'day' ) {
			return date;
		}

		const start =
			period === 'week' ? startOfISOWeek( parseISO( date ) ) : startOfMonth( parseISO( date ) );
		return format( start, 'yyyy-MM-dd' );
	};

	const interval = { start: parseISO( from ), end: parseISO( to ) };
	let bucketStarts = eachDayOfInterval( interval );
	if ( period === 'week' ) {
		bucketStarts = eachWeekOfInterval( interval, { weekStartsOn: 1 } );
	} else if ( period === 'month' ) {
		bucketStarts = eachMonthOfInterval( interval );
	}

	const totals = new Map< string, number >(
		bucketStarts.map( start => [ format( start, 'yyyy-MM-dd' ), 0 ] )
	);

	for ( const day of days ) {
		if ( day.date < from || day.date > to ) {
			continue;
		}

		const key = bucketKey( day.date );
		totals.set( key, ( totals.get( key ) ?? 0 ) + day.views );
	}

	return Array.from( totals.entries() )
		.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
		.map( ( [ date, value ] ) => ( { date: localTZDate( date ), value } ) );
}

/**
 * Fetch the scoped post's performance for the dashboard's report params. One
 * `stats/post` request carries everything: the daily view history (sliced
 * client-side into the primary and comparison windows, so comparison needs no
 * second request) and the lifetime comment/like totals. Comments and likes
 * have no per-post series or period totals in the API, so their tabs are
 * value-only with no delta.
 *
 * @param postId       - The scoped post ID (0 disables the request).
 * @param reportParams - The dashboard date range + comparison state.
 * @param period       - The selected bucket granularity (day/week/month).
 * @return The metric tabs and load/error state.
 */
export default function usePostPerformance(
	postId: number,
	reportParams: ReportParams,
	period: PostPerformancePeriod
): PostPerformanceState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsPost( {
		postId,
		fields: [ 'data', 'like_count', 'post' ],
	} );

	const metrics = useMemo< MetricTab[] >( () => {
		const days = data?.data ?? [];
		const window = toDayWindow( reportParams.from, reportParams.to );
		const compareWindow = toDayWindow( reportParams.compare_from, reportParams.compare_to );

		const current = window ? bucketDays( days, window, period ) : [];
		const previous = compareWindow ? bucketDays( days, compareWindow, period ) : undefined;
		const hasPrevious = !! previous?.length;

		const sum = ( points: { value: number }[] ) =>
			points.reduce( ( total, point ) => total + point.value, 0 );

		return [
			{
				key: 'views',
				label: __( 'Views', 'jetpack-premium-analytics' ),
				value: sum( current ),
				previousValue: hasPrevious ? sum( previous ) : undefined,
				current,
				previous: hasPrevious ? previous : undefined,
			},
			{
				key: 'comments',
				label: __( 'Comments', 'jetpack-premium-analytics' ),
				description: __(
					'All-time total — this metric has no per-post history.',
					'jetpack-premium-analytics'
				),
				value: Number( data?.post?.comment_count ) || 0,
				current: [],
			},
			{
				key: 'likes',
				label: __( 'Likes', 'jetpack-premium-analytics' ),
				description: __(
					'All-time total — this metric has no per-post history.',
					'jetpack-premium-analytics'
				),
				value: data?.like_count ?? 0,
				current: [],
			},
		];
	}, [
		data,
		period,
		reportParams.from,
		reportParams.to,
		reportParams.compare_from,
		reportParams.compare_to,
	] );

	return {
		metrics,
		isLoading,
		isFetching,
		isError,
		hasData: !! data,
		refetch,
	};
}
