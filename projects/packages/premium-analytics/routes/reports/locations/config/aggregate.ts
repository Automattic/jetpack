/**
 * Internal dependencies
 */
import type { LocationRow } from './fields';
import type {
	StatsLocationsItem,
	StatsNormalizedReport,
	StatsPeriod,
	StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';

type LocationChartPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * Map a daily bucket date onto its chart bucket key for the selected period —
 * the date itself for days, the start of the ISO week for weeks, and the
 * first-of-month date (`YYYY-MM-01`) for months.
 *
 * @param date   - The daily bucket date (`YYYY-MM-DD`).
 * @param period - The chart bucket period.
 * @return The bucket key the date aggregates into.
 */
function getChartBucketKey( date: string, period: LocationChartPeriod ): string {
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
 * Build a stable identity for a location within its country.
 *
 * Region and city names are not globally unique, so the country code remains
 * part of the key on every tab.
 *
 * @param item - A normalized location item.
 * @return The stable location identity.
 */
function getLocationId( item: StatsLocationsItem ): string {
	return `${ item.countryCode ?? '' }:${ String( item.label ?? '' ) }`;
}

/**
 * Convert the bucketed locations report to chart-ready views over time.
 *
 * @param report - The bucketed locations report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function locationsToTimeSeries(
	report: StatsNormalizedReport< StatsLocationsItem > | undefined,
	period: LocationChartPeriod = 'day'
): StatsTimeSeriesReport {
	const buckets = new Map< string, StatsTimeSeriesReport[ 'data' ][ number ] >();
	const points = [ ...( report?.data ?? [] ) ].sort( ( first, second ) =>
		first.time_interval.localeCompare( second.time_interval )
	);

	for ( const point of points ) {
		const views = point.items.reduce( ( total, item ) => total + item.views, 0 );
		const key = getChartBucketKey( point.time_interval, period );
		const existing = buckets.get( key );

		if ( existing ) {
			existing.date_end = point.date_end;
			existing.value = Number( existing.value ) + views;
			existing.views = Number( existing.views ) + views;
			continue;
		}

		buckets.set( key, {
			time_interval: key,
			date_start: point.date_start,
			date_end: point.date_end,
			label: key,
			items: [],
			value: views,
			views,
		} );
	}

	const data = [ ...buckets.values() ];
	const first = data[ 0 ];
	const last = data[ data.length - 1 ];

	return {
		summary: {
			...report?.summary,
			...( first ? { date_start: first.date_start } : {} ),
			...( last ? { date_end: last.date_end } : {} ),
		},
		data,
	};
}

/**
 * Aggregate location rows across report buckets for the records table.
 *
 * @param report - The bucketed locations report.
 * @return One row per location with views summed across buckets.
 */
export function aggregateLocationRows(
	report: StatsNormalizedReport< StatsLocationsItem > | undefined
): LocationRow[] {
	const rowsById = new Map< string, LocationRow >();

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const id = getLocationId( item );
			const existing = rowsById.get( id );

			if ( existing ) {
				existing.views += item.views;
				continue;
			}

			rowsById.set( id, {
				id,
				label: String( item.label ?? '' ),
				countryCode: item.countryCode,
				countryFull: item.countryFull ?? item.countryCode ?? '',
				views: item.views,
			} );
		}
	}

	return [ ...rowsById.values() ];
}
