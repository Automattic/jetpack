/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsLocationsItem,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import type { LocationRow } from './fields';

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
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const views = point.items.reduce( ( total, item ) => total + item.views, 0 );

		return { value: views, views };
	} );
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
