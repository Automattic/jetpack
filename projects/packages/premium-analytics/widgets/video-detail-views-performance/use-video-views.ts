/**
 * External dependencies
 */
import {
	useStatsSingleVideo,
	type ReportParams,
	type StatsSingleVideoDataPoint,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
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
import type { VideoDetailViewsPerformanceGranularity } from './widget';

/**
 * One chart point: a bucket-start date and the views summed into the bucket.
 */
export type VideoViewsPoint = {
	date: Date;
	value: number;
};

/**
 * Normalized Views performance state: the primary (and optional comparison)
 * series plus the requests' load/error flags. `hasData` distinguishes the
 * first load from refetches.
 */
export interface VideoViewsState {
	current: VideoViewsPoint[];
	previous?: VideoViewsPoint[];
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
 * Build a range's calendar buckets. Each bucket keeps the calendar label used
 * by the chart while clipping its data bounds to the selected range. Same
 * approach as the Post views widget's bucketing.
 *
 * @param dayWindow - The date-only window to keep.
 * @param period    - The bucket size.
 * @return One bucket per calendar period, oldest first.
 */
function calendarBucketWindows(
	dayWindow: DayWindow,
	period: VideoDetailViewsPerformanceGranularity
): BucketWindow[] {
	// The URL is user-editable, so an inverted range must not reach
	// `eachDayOfInterval()` (it throws).
	if ( dayWindow.from > dayWindow.to ) {
		return [];
	}

	const interval = { start: parseISO( dayWindow.from ), end: parseISO( dayWindow.to ) };
	let bucketStarts = eachDayOfInterval( interval );
	if ( period === 'week' ) {
		bucketStarts = eachWeekOfInterval( interval, { weekStartsOn: 1 } );
	} else if ( period === 'month' ) {
		bucketStarts = eachMonthOfInterval( interval );
	}

	return bucketStarts.map( ( start, index ) => {
		const date = format( start, 'yyyy-MM-dd' );
		const nextDate = bucketStarts[ index + 1 ];
		const end = nextDate ? format( addDays( nextDate, -1 ), 'yyyy-MM-dd' ) : dayWindow.to;

		return {
			date,
			from: date < dayWindow.from ? dayWindow.from : date,
			to: end > dayWindow.to ? dayWindow.to : end,
		};
	} );
}

/**
 * Map primary bucket boundaries onto the comparison range so both series
 * always chart the same bucket count, even when the comparison window crosses
 * a week/month boundary the primary one does not. Mirrors the Post views
 * widget: each comparison bucket starts at the same day offset from the
 * comparison start as its primary bucket does from the primary start, the
 * buckets partition the whole comparison range, and every end is clamped to
 * `comparisonWindow.to`.
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
		// any remaining comparison days, clamped to the selected window.
		const rawTo =
			index < froms.length - 1
				? format( addDays( parseISO( froms[ index + 1 ] ), -1 ), 'yyyy-MM-dd' )
				: comparisonWindow.to;
		const to = rawTo > comparisonWindow.to ? comparisonWindow.to : rawTo;

		return { date: from, from, to };
	} );
}

/**
 * Sum a single-video daily series into zero-filled buckets. The endpoint
 * returns a contiguous daily `{ period, value }` array for the requested
 * window, so unlike the Post views widget there is no sparse full history to
 * reconstruct — bucketing only sums the returned days and zero-fills whatever
 * the response is missing.
 *
 * @param points  - The video's daily views, oldest first.
 * @param buckets - The bucket bounds to sum.
 * @return One point per bucket, oldest first.
 */
function bucketDays(
	points: StatsSingleVideoDataPoint[],
	buckets: BucketWindow[]
): VideoViewsPoint[] {
	const totals = new Map< string, number >( buckets.map( bucket => [ bucket.date, 0 ] ) );

	for ( const point of points ) {
		const day = point.period.slice( 0, 10 );
		const bucket = buckets.find( candidate => day >= candidate.from && day <= candidate.to );
		if ( bucket ) {
			totals.set( bucket.date, ( totals.get( bucket.date ) ?? 0 ) + point.value );
		}
	}

	// The endpoint's bucket keys are plain site-local calendar dates, so each
	// point's instant must be that day's site-local midnight. `parseSiteDateTime`
	// anchors the offset-less key in the site timezone; the chart's `formatDate`
	// labels render in the same zone, so the calendar day round-trips without a
	// TZ-induced day shift (a date-only string fed to `localTZDate` would parse
	// as UTC midnight and read as the previous day on negative-offset sites).
	return buckets.map( bucket => ( {
		date: parseSiteDateTime( bucket.date ) ?? parseISO( bucket.date ),
		value: totals.get( bucket.date ) ?? 0,
	} ) );
}

/**
 * Fetch the scoped video's view trend for the dashboard's report params. The
 * `stats/video/{id}` endpoint takes its window from `period`/`start_date`/
 * `date` (wpcom #229903), so the comparison overlay needs its own request for
 * the comparison window — unlike `stats/post`, the endpoint has no
 * full-history response to slice both windows from. Both requests use
 * `statType=all` with the same params as the Video highlights widget, so the
 * primary request shares its cache entry instead of fetching a second time;
 * the chart consumes the leading `plays`/views series.
 *
 * @param videoId      - The scoped video ID (0 disables the requests).
 * @param reportParams - The dashboard date range + comparison state.
 * @param period       - The selected bucket granularity (day/week/month).
 * @return The view series and load/error state.
 */
export default function useVideoViews(
	videoId: number,
	reportParams: ReportParams,
	period: VideoDetailViewsPerformanceGranularity
): VideoViewsState {
	const primaryWindow = useMemo(
		() => toDayWindow( reportParams.from, reportParams.to ),
		[ reportParams.from, reportParams.to ]
	);
	const compareWindow = useMemo(
		() => toDayWindow( reportParams.compare_from, reportParams.compare_to ),
		[ reportParams.compare_from, reportParams.compare_to ]
	);
	const primary = useStatsSingleVideo(
		videoId,
		{ from: primaryWindow?.from, to: primaryWindow?.to, period: 'day', statType: 'all' },
		{ enabled: !! primaryWindow }
	);
	const comparison = useStatsSingleVideo(
		videoId,
		{ from: compareWindow?.from, to: compareWindow?.to, period: 'day', statType: 'all' },
		{ enabled: !! compareWindow }
	);

	const { current, previous } = useMemo( () => {
		const buckets = primaryWindow ? calendarBucketWindows( primaryWindow, period ) : [];
		const currentPoints = bucketDays( primary.data?.data ?? [], buckets );
		let comparisonBuckets: BucketWindow[] | undefined;
		if ( primaryWindow && compareWindow ) {
			// Day grouping must remain one point per actual calendar day. Relative
			// bucketing is only needed for coarser periods, where matching the
			// primary layout prevents partial week/month boundaries from scrunching
			// the comparison overlay.
			comparisonBuckets =
				period === 'day'
					? calendarBucketWindows( compareWindow, period )
					: relativeBucketWindows( primaryWindow, compareWindow, buckets );
		}
		const previousPoints = comparisonBuckets
			? bucketDays( comparison.data?.data ?? [], comparisonBuckets )
			: undefined;

		return {
			current: currentPoints,
			previous: previousPoints?.length ? previousPoints : undefined,
		};
	}, [ primary.data, comparison.data, period, primaryWindow, compareWindow ] );

	return {
		current,
		previous,
		isLoading: primary.isLoading || comparison.isLoading,
		isFetching: primary.isFetching || comparison.isFetching,
		isError: primary.isError || comparison.isError,
		hasData: !! primary.data,
		refetch: () => {
			void primary.refetch();
			if ( compareWindow ) {
				void comparison.refetch();
			}
		},
	};
}
