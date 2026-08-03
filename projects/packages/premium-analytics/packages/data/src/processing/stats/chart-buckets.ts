import type { StatsTimeSeriesReport } from './time-series';
import type { StatsNormalizedDataPoint, StatsNormalizedItem, StatsNormalizedReport } from './types';
import type { StatsPeriod } from '../../utils/stats-params';

export type StatsChartBucketPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

type StatsChartBucketValues = Record< string, number > & { value: number };

/**
 * Map a daily bucket date onto its chart bucket key for the selected period —
 * the date itself for days, the Monday start date of the ISO week for weeks,
 * and the first-of-month date (`YYYY-MM-01`) for months.
 *
 * @param date   - The daily bucket date (`YYYY-MM-DD`).
 * @param period - The chart bucket period.
 * @return The bucket key the date aggregates into.
 */
export function getStatsChartBucketKey( date: string, period: StatsChartBucketPeriod ): string {
	if ( period === 'day' ) {
		return date;
	}

	const bucketDate = new Date( `${ date.slice( 0, 10 ) }T00:00:00Z` );

	if ( period === 'week' ) {
		const daysSinceMonday = ( bucketDate.getUTCDay() + 6 ) % 7;
		bucketDate.setUTCDate( bucketDate.getUTCDate() - daysSinceMonday );
	} else {
		bucketDate.setUTCDate( 1 );
	}

	return bucketDate.toISOString().slice( 0, 10 );
}

/**
 * Collapse a normalized daily Stats report into chart buckets.
 *
 * The caller maps each data point to its chart metrics, including the required
 * headline `value`. Metrics are summed when daily points share a chart bucket.
 * Each bucket's `date_start` combines the bucket-key date with the first daily
 * point's time and offset. This keeps `localTZDate()` anchored to the bucket-key
 * calendar date; a bare `YYYY-MM-DD` would instead be parsed as a UTC instant.
 *
 * @param report          - The normalized daily Stats report.
 * @param period          - The chart bucket period.
 * @param getBucketValues - Extract the numeric chart metrics from a data point.
 * @return The chart-ready time series.
 */
export function bucketStatsTimeSeries< TItem extends StatsNormalizedItem >(
	report: StatsNormalizedReport< TItem > | undefined,
	period: StatsChartBucketPeriod,
	getBucketValues: ( point: StatsNormalizedDataPoint< TItem > ) => StatsChartBucketValues
): StatsTimeSeriesReport {
	const buckets = new Map< string, StatsTimeSeriesReport[ 'data' ][ number ] >();
	const points = report?.data ?? [];

	for ( const point of points ) {
		const key = getStatsChartBucketKey( point.time_interval, period );
		const values = getBucketValues( point );
		const existing = buckets.get( key );

		if ( existing ) {
			existing.date_end = point.date_end;

			for ( const [ metric, value ] of Object.entries( values ) ) {
				existing[ metric ] = Number( existing[ metric ] ?? 0 ) + value;
			}

			continue;
		}

		buckets.set( key, {
			time_interval: key,
			date_start: `${ key }${ point.date_start.slice( 10 ) }`,
			date_end: point.date_end,
			label: key,
			items: [],
			...values,
		} );
	}

	const data = [ ...buckets.values() ];
	const first = points[ 0 ];
	const last = points[ points.length - 1 ];

	return {
		summary: {
			...report?.summary,
			...( first ? { date_start: first.date_start } : {} ),
			...( last ? { date_end: last.date_end } : {} ),
		},
		data,
	};
}
