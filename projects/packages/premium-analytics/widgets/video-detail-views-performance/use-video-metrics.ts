/**
 * External dependencies
 */
import {
	useStatsSingleVideo,
	type ReportParams,
	type StatsChartBucketPeriod,
	type StatsSingleVideoDataPoint,
} from '@jetpack-premium-analytics/data';
import {
	getRangeBuckets,
	resolveBucketStamp,
	type RangeBucket,
} from '@jetpack-premium-analytics/datetime';
import {
	HEADLINE_COUNT_FORMAT,
	HOURS_DATA_FORMAT,
	toDayRange,
	type CountLabel,
	type DataFormat,
	type MetricTab,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */

/**
 * One chart point: the first and last day of the bucket that fall in the range,
 * and the metric's value for it.
 */
export type VideoMetricPoint = {
	date: Date;
	endDate?: Date;
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
	isPlaceholderData: boolean;
	/** The raw request error, for `describeError()` to classify. */
	error: unknown;
	/** The zone the bucket dates are in. */
	timezone: string;
	hasData: boolean;
	refetch: () => void;
}

const RATE_FORMAT: DataFormat = {
	type: 'percentage',
	options: { decimals: 1, signDisplay: 'never' },
};

/**
 * Sums a daily series into zero-filled bucket totals. The endpoint returns a
 * contiguous daily array for the window, so this only sums returned days and
 * zero-fills what's missing.
 */
function bucketTotals(
	points: StatsSingleVideoDataPoint[],
	buckets: RangeBucket[]
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
 * Turns bucket totals into chart points.
 */
function toBucketPoints(
	buckets: RangeBucket[],
	totals: Map< string, number >,
	zone: string
): VideoMetricPoint[] {
	return buckets.flatMap( bucket => {
		// The clipped bounds, so the tooltip names a month the range cuts by its days.
		const date = resolveBucketStamp( bucket.from, zone );
		const endDate = resolveBucketStamp( bucket.to, zone );
		const value = totals.get( bucket.date ) ?? 0;

		return date ? [ endDate ? { date, endDate, value } : { date, value } ] : [];
	} );
}

/**
 * Weights each day's retention by that day's plays, so a bucket reflects the
 * retention of its combined plays, not a raw average of days. Rates arrive as
 * percentages; returned fractions match the tab's format. No plays → 0.
 */
function playWeightedRetention(
	rates: StatsSingleVideoDataPoint[],
	plays: StatsSingleVideoDataPoint[],
	buckets: RangeBucket[]
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
 * Fetches metric tabs via one `stats/video/{id}` `statType=all` report,
 * headlined by the response's canonical totals (falling back to bucketed
 * sums). Comparison params are ignored: the video page has no period-over-period view.
 */
export default function useVideoMetrics(
	videoId: number,
	reportParams: ReportParams,
	period: StatsChartBucketPeriod
): VideoMetricsState {
	const primaryWindow = useMemo(
		() => toDayRange( reportParams.from, reportParams.to ),
		[ reportParams.from, reportParams.to ]
	);
	const { data, timezone, isLoading, isFetching, isError, isPlaceholderData, error, refetch } =
		useStatsSingleVideo(
			videoId,
			{ from: reportParams.from, to: reportParams.to, period: 'day', statType: 'all' },
			{ enabled: !! primaryWindow }
		);

	const metrics = useMemo< MetricTab[] >( () => {
		const buckets = primaryWindow ? getRangeBuckets( primaryWindow, period ) : [];
		// The leading tuple column doubles as the plays series, so Views renders
		// even from a response without named `fields`.
		const playsSeries = data?.series?.plays ?? data?.data ?? [];
		const total = data?.total;

		const sumTab = (
			key: string,
			label: string,
			points: StatsSingleVideoDataPoint[],
			serverTotal: number | undefined,
			dataFormat: DataFormat,
			countLabel?: CountLabel
		): MetricTab => {
			const current = toBucketPoints( buckets, bucketTotals( points, buckets ), timezone );
			return {
				key,
				label,
				value: serverTotal ?? current.reduce( ( sum, point ) => sum + point.value, 0 ),
				current,
				dataFormat,
				countLabel,
			};
		};

		const tabs: MetricTab[] = [
			sumTab(
				'views',
				__( 'Views', 'jetpack-premium-analytics-pkg' ),
				playsSeries,
				total?.plays,
				HEADLINE_COUNT_FORMAT,
				count =>
					/* translators: %s: number of views. */
					_n( '%s View', '%s Views', count, 'jetpack-premium-analytics-pkg' )
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
					HEADLINE_COUNT_FORMAT,
					count =>
						/* translators: %s: number of impressions. */
						_n( '%s Impression', '%s Impressions', count, 'jetpack-premium-analytics-pkg' )
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
					HOURS_DATA_FORMAT
				)
			);
		}
		if ( data?.series?.retention_rate ) {
			const rates = data.series.retention_rate;
			const current = toBucketPoints(
				buckets,
				playWeightedRetention( rates, playsSeries, buckets ),
				timezone
			);
			// Headline fallback: the same play-weighting over the whole window as
			// one bucket. The server total is canonical when present.
			const windowBucket = primaryWindow ? { date: primaryWindow.from, ...primaryWindow } : null;
			const windowRate = windowBucket
				? ( playWeightedRetention( rates, playsSeries, [ windowBucket ] ).get(
						windowBucket.date
					) ?? 0 )
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
	}, [ data, period, primaryWindow, timezone ] );

	return {
		metrics,
		isLoading,
		isFetching,
		isError,
		isPlaceholderData,
		error,
		timezone,
		hasData: !! data,
		refetch: () => void refetch(),
	};
}
