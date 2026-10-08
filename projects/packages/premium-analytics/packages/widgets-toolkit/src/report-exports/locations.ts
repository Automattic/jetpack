/**
 * External dependencies
 */
import {
	fetchStatsLocationsRows,
	type ReportParams,
	type StatsLocationCoordinates,
	type StatsLocationsComparisonItem,
	type StatsLocationsParams,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import { cleanForSlug } from '@wordpress/url';
/**
 * Internal dependencies
 */
import type { ReportCsvExporter } from './types';
import type { LocationsGeoMode } from '../components/locations-geo-chart';

export type LocationsReportSection = 'countries' | 'regions' | 'cities';

/** The geo mode each section reports on, as the API and the map both name it. */
export const LOCATIONS_GEO_MODES = {
	countries: 'country',
	regions: 'region',
	cities: 'city',
} as const satisfies Record< LocationsReportSection, LocationsGeoMode >;

const SECTIONS_BY_GEO_MODE: Record< LocationsGeoMode, LocationsReportSection > = {
	country: 'countries',
	region: 'regions',
	city: 'cities',
};

/** A country, or a region inside it, that narrows the rows. */
export type LocationsScope = { country: string; region?: string };

export function getLocationsReportSection( geoMode: LocationsGeoMode ): LocationsReportSection {
	return SECTIONS_BY_GEO_MODE[ geoMode ];
}

/**
 * Name the location column after the section's place type, in the table and the CSV alike.
 *
 * @param section - The Locations section.
 * @return The column label.
 */
export function getLocationColumnLabel( section: LocationsReportSection ): string {
	switch ( section ) {
		case 'regions':
			return __( 'Region', 'jetpack-premium-analytics-pkg' );
		case 'cities':
			return __( 'City', 'jetpack-premium-analytics-pkg' );
		default:
			return __( 'Country', 'jetpack-premium-analytics-pkg' );
	}
}

/** Countries is already the full country list, so only the other sections take a country. */
export function supportsLocationsCountryFilter( section: LocationsReportSection ): boolean {
	return section !== 'countries';
}

export type LocationRow = {
	id: string;
	label: string;
	countryCode?: string;
	countryFull: string;
	views: number;
	previousViews?: number;
	coordinates?: StatsLocationCoordinates;
};

/**
 * Build the records table's rows from the shared comparison rows.
 *
 * Region and city names are not globally unique, so the country code stays part
 * of the row identity on every tab.
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
			id: `${ item.countryCode ?? '' }:${ label }`,
			label,
			countryCode: item.countryCode,
			countryFull: item.countryFull ?? item.countryCode ?? '',
			views: item.views,
			previousViews: item.previousViews,
			coordinates: item.coordinates,
		};
	} );
}

/**
 * The Locations report's query for one section. Without `summarize`, the API returns the
 * whole list once per day, which the comparison merge cannot align; `max: 0` keeps every row.
 */
export function getLocationsReportQueryParams(
	reportParams: ReportParams,
	section: LocationsReportSection,
	scope?: LocationsScope
): StatsLocationsParams {
	return {
		...reportParams,
		max: 0,
		summarize: 1,
		period: 'day',
		geoMode: LOCATIONS_GEO_MODES[ section ],
		...getLocationsScopeParams( scope ),
	};
}

/** The Stats query params that narrow the rows to a scope. */
export function getLocationsScopeParams(
	scope?: LocationsScope
): Pick< StatsLocationsParams, 'filter_by_country' | 'filter_by_region' > {
	return {
		...( scope ? { filter_by_country: scope.country } : {} ),
		...( scope?.region ? { filter_by_region: scope.region } : {} ),
	};
}

const byViewsDescending = ( a: LocationRow, b: LocationRow ) => b.views - a.views;

/** The Locations report's CSV for one section, inside the scope the table or widget shows. */
export function locationsCsvExporter(
	section: LocationsReportSection,
	scope?: LocationsScope
): ReportCsvExporter< LocationRow, LocationRow > {
	return {
		filenamePrefix: [ 'locations', section, scope?.country, scope?.region ]
			.map( part => cleanForSlug( part ?? '' ) )
			.filter( Boolean )
			.join( '-' ),
		hasDateRange: true,
		fetchItems: async reportParams =>
			buildLocationRows(
				await fetchStatsLocationsRows(
					getLocationsReportQueryParams( reportParams, section, scope )
				)
			),
		// Match the table's own default order, so the file reads like the screen.
		toCsvRows: items => [ ...items ].sort( byViewsDescending ),
		getColumns: () => [
			{ label: getLocationColumnLabel( section ), getValue: row => row.label },
			// Region and city names repeat across countries. On screen the flag tells
			// them apart; a CSV needs its own column.
			...( supportsLocationsCountryFilter( section )
				? [
						{
							label: __( 'Country', 'jetpack-premium-analytics-pkg' ),
							getValue: ( row: LocationRow ) => row.countryFull,
						},
					]
				: [] ),
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		],
	};
}
