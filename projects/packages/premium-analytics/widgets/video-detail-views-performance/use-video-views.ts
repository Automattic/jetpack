/**
 * External dependencies
 */
import {
	useStatsSingleVideo,
	type ReportParams,
	type StatsSingleVideoDataPoint,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { toDay } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import {
	addDays,
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
 * Normalized Views performance state: the view series plus the request's
 * load/error flags. `hasData` distinguishes the first load from refetches.
 */
export interface VideoViewsState {
	current: VideoViewsPoint[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	/** The raw request error, for `describeError()` to classify. */
	error: unknown;
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
 * Extract a `YYYY-MM-DD` window from ISO report params, or undefined when
 * either bound is missing/malformed (`toDay` also rejects calendar-invalid
 * days before they reach `parseISO()`/`each*OfInterval()`, which throw on
 * them). The endpoint's day keys are date-only, so comparing date prefixes
 * keeps the slice timezone-stable.
 *
 * @param from - The window's ISO start.
 * @param to   - The window's ISO end.
 * @return The date-only window.
 */
function toDayWindow( from?: string, to?: string ): DayWindow | undefined {
	const fromDay = toDay( from );
	const toDayBound = toDay( to );

	if ( ! fromDay || ! toDayBound ) {
		return undefined;
	}

	return { from: fromDay, to: toDayBound };
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
 * `date` (wpcom #229903); the request uses `statType=all` with the same
 * params as the Video highlights widget, so the two share one cache entry,
 * and the chart consumes the leading `plays`/views series. The video detail
 * design has no period-over-period comparison, so comparison report params
 * are ignored — they ride along in the URL untouched so dashboard state
 * survives the round trip, and every widget on this page disregards them.
 *
 * @param videoId      - The scoped video ID (0 disables the request).
 * @param reportParams - The dashboard date range.
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
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsSingleVideo(
		videoId,
		{ from: primaryWindow?.from, to: primaryWindow?.to, period: 'day', statType: 'all' },
		{ enabled: !! primaryWindow }
	);

	const current = useMemo( () => {
		const buckets = primaryWindow ? calendarBucketWindows( primaryWindow, period ) : [];

		return bucketDays( data?.data ?? [], buckets );
	}, [ data, period, primaryWindow ] );

	return {
		current,
		isLoading,
		isFetching,
		isError,
		error,
		hasData: !! data,
		refetch: () => void refetch(),
	};
}
