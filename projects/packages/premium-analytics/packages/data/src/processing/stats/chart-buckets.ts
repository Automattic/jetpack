import type { StatsTimeSeriesReport } from './time-series';
import type { StatsNormalizedDataPoint, StatsNormalizedItem, StatsNormalizedReport } from './types';
import type { StatsPeriod } from '../../utils/stats-params';

/**
 * The buckets a client-side bucketed chart can draw, ordered finest first —
 * the order `defaultPeriodForInterval()` clamps against. `satisfies` ties the
 * set to what the Stats endpoints accept, so it cannot drift from `StatsPeriod`.
 */
export const STATS_CHART_BUCKET_PERIODS = [
	'day',
	'week',
	'month',
] as const satisfies readonly StatsPeriod[];

/**
 * A chart bucket size, derived from the runtime tuple so both stay in sync.
 */
export type StatsChartBucketPeriod = ( typeof STATS_CHART_BUCKET_PERIODS )[ number ];

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
 * Metrics are summed when daily points share a bucket, and each bucket keeps the
 * first daily point's time suffix.
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
