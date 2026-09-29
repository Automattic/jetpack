/**
 * External dependencies
 */
import type { LocationRow } from './fields';
import type { StatsLocationsComparisonItem } from '@jetpack-premium-analytics/data';

/**
 * Build the records table's rows from the shared comparison rows.
 *
 * Region and city names are not globally unique, so the country code (and a
 * city's region) stays part of the row identity on every tab.
 *
 * @param items - Merged location rows for the active tab.
 * @return One row per location.
 */
export function buildLocationRows(
	items: StatsLocationsComparisonItem[] | undefined
): LocationRow[] {
	return ( items ?? [] ).map( item => {
		const label = String( item.label ?? '' );

		return {
			id: item.region
				? `${ item.countryCode ?? '' }:${ item.region }:${ label }`
				: `${ item.countryCode ?? '' }:${ label }`,
			label,
			countryCode: item.countryCode,
			countryFull: item.countryFull ?? item.countryCode ?? '',
			views: item.views,
			previousViews: item.previousViews,
			coordinates: item.coordinates,
		};
	} );
}
