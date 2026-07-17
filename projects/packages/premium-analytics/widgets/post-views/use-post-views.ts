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
import {
	addDays,
	differenceInCalendarDays,
	eachDayOfInterval,
	eachMonthOfInterval,
	eachWeekOfInterval,
	format,
	parseISO,
} from 'date-fns';
/**
 * Internal dependencies
 */
import type { PostViewsGranularity } from './widget';

/**
 * One chart point: a bucket-start date and the views summed into the bucket.
 */
export type PostViewsPoint = {
	date: Date;
	value: number;
};

/**
 * Normalized Post views state: the primary (and optional comparison) series
 * plus the request's load/error flags. `hasData` distinguishes the first load
 * from refetches.
 */
export interface PostViewsState {
	current: PostViewsPoint[];
	previous?: PostViewsPoint[];
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
 * One calendar bucket, including its visible label and the portion that falls
 * inside the selected date window.
 */
type BucketWindow = {
	date: string;
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
 * Build the primary range's calendar buckets. Each bucket keeps the calendar
 * label used by the primary chart while clipping its data bounds to the
 * selected range. The clipped bounds can then be applied to the comparison
 * range as relative offsets, which preserves the primary series' bucket count
 * across calendar boundaries.
 *
 * @param window - The date-only window to keep.
 * @param period - The bucket size.
 * @return One bucket per calendar period, oldest first.
 */
function calendarBucketWindows( window: DayWindow, period: PostViewsGranularity ): BucketWindow[] {
	// The URL is user-editable, so an inverted range must not reach
	// `eachDayOfInterval()` (it throws).
	if ( window.from > window.to ) {
		return [];
	}

	const interval = { start: parseISO( window.from ), end: parseISO( window.to ) };
	let bucketStarts = eachDayOfInterval( interval );
	if ( period === 'week' ) {
		bucketStarts = eachWeekOfInterval( interval, { weekStartsOn: 1 } );
	} else if ( period === 'month' ) {
		bucketStarts = eachMonthOfInterval( interval );
	}

	return bucketStarts.map( ( start, index ) => {
		const date = format( start, 'yyyy-MM-dd' );
		const nextDate = bucketStarts[ index + 1 ];
		const end = nextDate ? format( addDays( nextDate, -1 ), 'yyyy-MM-dd' ) : window.to;

		return {
			date,
			from: date < window.from ? window.from : date,
			to: end > window.to ? window.to : end,
		};
	} );
}

/**
 * Map primary bucket boundaries onto the comparison range. For example, a
 * primary March 1–31 range has one monthly bucket; its equal-length January
 * 29–February 28 comparison range must also have one bucket, even though it
 * crosses two calendar months.
 *
 * Each comparison bucket starts at the same day offset from the comparison
 * range's start as its primary bucket does from the primary start, so the
 * bucket count always matches. The buckets fully partition the comparison
 * range: every bucket's end is the next bucket's start minus a day, and the
 * last bucket extends to `comparisonWindow.to`. That keeps the comparison a
 * complete, non-overlapping cover of the selected range — a longer previous
 * period (previous-month onto a shorter month) folds its tail into the last
 * bucket instead of being truncated, and every bound is clamped to
 * `comparisonWindow.to` so a shorter one never reaches past the selection.
 *
 * @param primaryWindow    - The selected primary range.
 * @param comparisonWindow - The previous-period range.
 * @param buckets          - Calendar buckets clipped to the primary range.
 * @return Comparison buckets with the primary range's relative boundaries.
 */
function relativeBucketWindows(
	primaryWindow: DayWindow,
	comparisonWindow: DayWindow,
	buckets: BucketWindow[]
): BucketWindow[] {
	const primaryStart = parseISO( primaryWindow.from );
	const comparisonStart = parseISO( comparisonWindow.from );

	const froms = buckets.map( bucket =>
		format(
			addDays( comparisonStart, differenceInCalendarDays( parseISO( bucket.from ), primaryStart ) ),
			'yyyy-MM-dd'
		)
	);

	return froms.map( ( from, index ) => {
		// Each bucket runs up to the next bucket's start; the last one absorbs
		// any remaining comparison days. Clamp the end to the selected window so
		// a longer primary offset can't pull in out-of-range days. `from` is left
		// unclamped so a shorter comparison keeps distinct (empty) trailing
		// buckets rather than collapsing several onto the same key.
		const rawTo =
			index < froms.length - 1
				? format( addDays( parseISO( froms[ index + 1 ] ), -1 ), 'yyyy-MM-dd' )
				: comparisonWindow.to;
		const to = rawTo > comparisonWindow.to ? comparisonWindow.to : rawTo;

		return { date: from, from, to };
	} );
}

/**
 * Sum the post's daily view history into zero-filled buckets. The endpoint
 * may omit zero-view days and the history only starts at publication, but
 * those missing values are genuine zeroes. The full history is bucketed
 * client-side because the endpoint's `weeks` field only covers a fixed recent
 * window.
 *
 * @param days    - The post's daily views, oldest first.
 * @param buckets - The bucket bounds to sum.
 * @return One point per bucket, oldest first.
 */
function bucketDays( days: StatsPostDay[], buckets: BucketWindow[] ): PostViewsPoint[] {
	const totals = new Map< string, number >( buckets.map( bucket => [ bucket.date, 0 ] ) );

	for ( const day of days ) {
		const bucket = buckets.find(
			candidate => day.date >= candidate.from && day.date <= candidate.to
		);
		if ( bucket ) {
			totals.set( bucket.date, ( totals.get( bucket.date ) ?? 0 ) + day.views );
		}
	}

	return buckets.map( bucket => ( {
		date: localTZDate( bucket.date ),
		value: totals.get( bucket.date ) ?? 0,
	} ) );
}

/**
 * Fetch the scoped post's view trend for the dashboard's report params. One
 * `stats/post` request carries the full daily view history; the primary and
 * comparison windows are sliced from it client-side, so comparison needs no
 * second request.
 *
 * @param postId       - The scoped post ID (0 disables the request).
 * @param reportParams - The dashboard date range + comparison state.
 * @param period       - The selected bucket granularity (day/week/month).
 * @return The view series and load/error state.
 */
export default function usePostViews(
	postId: number,
	reportParams: ReportParams,
	period: PostViewsGranularity
): PostViewsState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsPost( {
		postId,
		fields: [ 'data' ],
	} );

	const { current, previous } = useMemo( () => {
		const days = data?.data ?? [];
		const window = toDayWindow( reportParams.from, reportParams.to );
		const compareWindow = toDayWindow( reportParams.compare_from, reportParams.compare_to );
		const buckets = window ? calendarBucketWindows( window, period ) : [];
		const currentPoints = bucketDays( days, buckets );
		const previousPoints =
			window && compareWindow
				? bucketDays( days, relativeBucketWindows( window, compareWindow, buckets ) )
				: undefined;

		return {
			current: currentPoints,
			previous: previousPoints?.length ? previousPoints : undefined,
		};
	}, [
		data,
		period,
		reportParams.from,
		reportParams.to,
		reportParams.compare_from,
		reportParams.compare_to,
	] );

	return {
		current,
		previous,
		isLoading,
		isFetching,
		isError,
		hasData: !! data,
		refetch,
	};
}
