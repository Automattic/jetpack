/**
 * External dependencies
 */
import {
	useStatsSingleVideo,
	type ReportParams,
	type StatsChartBucketPeriod,
	type StatsSingleVideoDataPoint,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { toDay, type DataFormat, type MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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

/**
 * One chart point: a bucket-start date and the metric's value for the bucket.
 */
export type VideoMetricPoint = {
	date: Date;
	value: number;
};

/**
 * Normalized video performance state: one metric tab per video metric plus the
 * request's load/error flags. `hasData` distinguishes the first load from
 * refetches.
 */
export interface VideoMetricsState {
	metrics: MetricTab[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	/** The raw request error, for `describeError()` to classify. */
	error: unknown;
	hasData: boolean;
	refetch: () => void;
}

/**
 * Whole-number count format, shared with the chart's required fallback format.
 */
export const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const HOURS_FORMAT: DataFormat = {
	type: 'number',
	options: { decimals: 1 },
};

const RATE_FORMAT: DataFormat = {
	type: 'percentage',
	options: { decimals: 1, signDisplay: 'never' },
};

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
 * Sum a daily series into zero-filled bucket totals keyed by bucket date. The
 * endpoint returns a contiguous daily `{ period, value }` array for the
 * requested window, so bucketing only sums the returned days and zero-fills
 * whatever the response is missing.
 */
function bucketTotals(
	points: StatsSingleVideoDataPoint[],
	buckets: BucketWindow[]
): Map< string, number > {
	const totals = new Map< string, number >( buckets.map( bucket => [ bucket.date, 0 ] ) );

	for ( const point of points ) {
		const day = point.period.slice( 0, 10 );
		const bucket = buckets.find( candidate => day >= candidate.from && day <= candidate.to );
		if ( bucket ) {
			totals.set( bucket.date, ( totals.get( bucket.date ) ?? 0 ) + point.value );
		}
	}

	return totals;
}

/**
 * Turn bucket totals into chart points.
 *
 * The endpoint's bucket keys are plain site-local calendar dates, so each
 * point's instant must be that day's site-local midnight. `parseSiteDateTime`
 * anchors the offset-less key in the site timezone; the chart's `formatDate`
 * labels render in the same zone, so the calendar day round-trips.
 */
function toBucketPoints(
	buckets: BucketWindow[],
	totals: Map< string, number >
): VideoMetricPoint[] {
	return buckets.map( bucket => ( {
		date: parseSiteDateTime( bucket.date ) ?? parseISO( bucket.date ),
		value: totals.get( bucket.date ) ?? 0,
	} ) );
}

/**
 * Weight each day's retention rate by that day's plays, so a bucket's value is
 * the retention of its combined plays rather than a raw average of days. The
 * daily rates arrive as percentages; the returned fractions match the tab's
 * percentage format. A bucket with no plays has no measured retention — it
 * stays at 0.
 */
function playWeightedRetention(
	rates: StatsSingleVideoDataPoint[],
	plays: StatsSingleVideoDataPoint[],
	buckets: BucketWindow[]
): Map< string, number > {
	const playsByDay = new Map< string, number >(
		plays.map( point => [ point.period.slice( 0, 10 ), point.value ] )
	);
	const weightedRates = rates.map( point => ( {
		period: point.period,
		value: point.value * ( playsByDay.get( point.period.slice( 0, 10 ) ) ?? 0 ),
	} ) );

	const playTotals = bucketTotals( plays, buckets );
	const weightedTotals = bucketTotals( weightedRates, buckets );

	return new Map(
		buckets.map( bucket => {
			const bucketPlays = playTotals.get( bucket.date ) ?? 0;
			const weighted = weightedTotals.get( bucket.date ) ?? 0;
			return [ bucket.date, bucketPlays > 0 ? weighted / bucketPlays / 100 : 0 ];
		} )
	);
}

/**
 * Fetch the scoped video's metric tabs for the dashboard's report params. The
 * `stats/video/{id}` endpoint takes its window from `period`/`start_date`/
 * `date` (wpcom #229903); the request uses `statType=all` with the raw report
 * params so it stays one request for the whole page, and each returned metric
 * series becomes a chart tab. Headlines come from the response's canonical
 * whole-range `total`s — including the play-weighted retention rate the daily
 * series alone cannot reproduce — falling back to the bucketed sums when a
 * total is missing. The video detail design has no period-over-period
 * comparison, so comparison report params are ignored — they ride along in the
 * URL untouched so dashboard state survives the round trip, and every widget
 * on this page disregards them.
 */
export default function useVideoMetrics(
	videoId: number,
	reportParams: ReportParams,
	period: StatsChartBucketPeriod
): VideoMetricsState {
	const primaryWindow = useMemo(
		() => toDayWindow( reportParams.from, reportParams.to ),
		[ reportParams.from, reportParams.to ]
	);
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsSingleVideo(
		videoId,
		{ from: reportParams.from, to: reportParams.to, period: 'day', statType: 'all' },
		{ enabled: !! primaryWindow }
	);

	const metrics = useMemo< MetricTab[] >( () => {
		const buckets = primaryWindow ? calendarBucketWindows( primaryWindow, period ) : [];
		// The leading tuple column doubles as the plays series, so Views renders
		// even from a response without named `fields`.
		const playsSeries = data?.series?.plays ?? data?.data ?? [];
		const total = data?.total;

		const sumTab = (
			key: string,
			label: string,
			points: StatsSingleVideoDataPoint[],
			serverTotal: number | undefined,
			dataFormat: DataFormat
		): MetricTab => {
			const current = toBucketPoints( buckets, bucketTotals( points, buckets ) );
			return {
				key,
				label,
				value: serverTotal ?? current.reduce( ( sum, point ) => sum + point.value, 0 ),
				current,
				dataFormat,
			};
		};

		const tabs: MetricTab[] = [
			sumTab(
				'views',
				__( 'Views', 'jetpack-premium-analytics-pkg' ),
				playsSeries,
				total?.plays,
				COUNT_FORMAT
			),
		];

		// A metric absent from the response's `fields` is unknown, not a measured
		// zero — omitting its tab beats charting a fabricated flatline.
		if ( data?.series?.impressions ) {
			tabs.push(
				sumTab(
					'impressions',
					__( 'Impressions', 'jetpack-premium-analytics-pkg' ),
					data.series.impressions,
					total?.impressions,
					COUNT_FORMAT
				)
			);
		}
		if ( data?.series?.watch_time ) {
			tabs.push(
				sumTab(
					'watch-time',
					__( 'Hours watched', 'jetpack-premium-analytics-pkg' ),
					data.series.watch_time,
					total?.watch_time,
					HOURS_FORMAT
				)
			);
		}
		if ( data?.series?.retention_rate ) {
			const rates = data.series.retention_rate;
			const current = toBucketPoints(
				buckets,
				playWeightedRetention( rates, playsSeries, buckets )
			);
			// Headline fallback: the same play-weighting over the whole window as
			// one bucket. The server total is canonical when present.
			const windowBucket = primaryWindow ? { date: primaryWindow.from, ...primaryWindow } : null;
			const windowRate = windowBucket
				? playWeightedRetention( rates, playsSeries, [ windowBucket ] ).get( windowBucket.date ) ??
				  0
				: 0;
			tabs.push( {
				key: 'retention-rate',
				label: __( 'Retention rate', 'jetpack-premium-analytics-pkg' ),
				value: total?.retention_rate !== undefined ? total.retention_rate / 100 : windowRate,
				current,
				dataFormat: RATE_FORMAT,
			} );
		}

		return tabs;
	}, [ data, period, primaryWindow ] );

	return {
		metrics,
		isLoading,
		isFetching,
		isError,
		error,
		hasData: !! data,
		refetch: () => void refetch(),
	};
}
