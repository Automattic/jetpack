/**
 * External dependencies
 */
import {
	useStatsPost,
	type ReportParams,
	type StatsChartBucketPeriod,
	type StatsPostDay,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
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
 * One chart point: a bucket-start date and the views summed into the bucket.
 */
export type PostViewsPoint = {
	date: Date;
	value: number;
};

/**
 * Normalized Post views state: the view series plus the request's load/error
 * flags. `hasData` distinguishes the first load from refetches.
 */
export interface PostViewsState {
	current: PostViewsPoint[];
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
 * Build the range's calendar buckets. Each bucket keeps the calendar label
 * used by the chart while clipping its data bounds to the selected range.
 * Buckets are returned oldest first.
 */
function calendarBucketWindows(
	dayWindow: DayWindow,
	period: StatsChartBucketPeriod
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
 * Sum the post's daily view history into zero-filled buckets. The endpoint
 * may omit zero-view days and the history only starts at publication, but
 * those missing values are genuine zeroes. The full history is bucketed
 * client-side because the endpoint's `weeks` field only covers a fixed recent
 * window.
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

	// The endpoint's day keys are plain site-local calendar dates, so each
	// point's instant must be that day's site-local midnight. `parseSiteDateTime`
	// anchors the offset-less key in the site timezone; the chart's `formatDate`
	// labels render in the same zone, so the calendar day round-trips.
	// `bucket.date` comes from `format( start, 'yyyy-MM-dd' )`, so the parse
	// cannot fail in practice; drop the point rather than guess if it ever does.
	return buckets.flatMap( bucket => {
		const date = parseSiteDateTime( bucket.date );
		return date ? [ { date, value: totals.get( bucket.date ) ?? 0 } ] : [];
	} );
}

/**
 * Fetch the scoped post's view trend for the dashboard's report params. One
 * `stats/post` request carries the full daily view history; the selected
 * window is sliced from it client-side. A `postId` of 0 disables the request.
 * The post detail design has no period-over-period comparison, so comparison
 * report params are ignored — they ride along in the URL untouched so
 * dashboard state survives the round trip, and every widget on this page
 * disregards them.
 */
export default function usePostViews(
	postId: number,
	reportParams: ReportParams,
	period: StatsChartBucketPeriod
): PostViewsState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsPost( {
		postId,
		fields: [ 'data' ],
	} );

	const current = useMemo( () => {
		const days = data?.data ?? [];
		const dayWindow = toDayWindow( reportParams.from, reportParams.to );
		const buckets = dayWindow ? calendarBucketWindows( dayWindow, period ) : [];

		return bucketDays( days, buckets );
	}, [ data, period, reportParams.from, reportParams.to ] );

	return {
		current,
		isLoading,
		isFetching,
		isError,
		hasData: !! data,
		refetch,
	};
}
