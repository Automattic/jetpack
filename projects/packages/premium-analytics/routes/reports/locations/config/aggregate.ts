/**
 * External dependencies
 */
import type { LocationRow } from './fields';
import type { StatsLocationsItem, StatsNormalizedReport } from '@jetpack-premium-analytics/data';

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
