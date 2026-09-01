/**
 * External dependencies
 */
import {
	GoogleDataTableColumnRoleType,
	type GeoData,
	type GoogleDataTableColumn,
	type GoogleDataTableRow,
} from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __, _n, sprintf } from '@wordpress/i18n';

/** One location plotted on the map. */
export interface LocationsGeoRow {
	label: string;
	value: number;
	countryCode: string;
	countryFull: string;
}

/** The granularity of the rows handed to the map. */
export type LocationsGeoMode = 'country' | 'region' | 'city';

/** A country the map is scoped to, from a drill-down or a report filter. */
export interface LocationsGeoFocusCountry {
	code: string;
	name: string;
}

export interface BuildLocationsGeoChartArgs {
	rows: LocationsGeoRow[];
	mode: LocationsGeoMode;
	focusCountry?: LocationsGeoFocusCountry;
	/** Whether Google has a `provinces` map for the focused country. */
	provinceMapSupported?: boolean;
}

export interface LocationsGeoChartConfig {
	data: GeoData;
	region: string;
	resolution: 'countries' | 'provinces';
}

type CountrySummary = {
	countryFull: string;
	value: number;
	locations: LocationsGeoRow[];
};

// A GeoChart tooltip is a single cell, so the summed locations share one HTML
// string. The list is capped to keep a tooltip from overflowing the map.
const MAX_TOOLTIP_LOCATIONS = 10;

/**
 * Map a country code to the id Google GeoChart plots it under.
 *
 * @param countryCode - ISO country code.
 * @return The GeoChart country id.
 */
export function getGeoChartCountryId( countryCode: string ): string {
	if ( countryCode.toUpperCase() === 'TW' ) {
		return 'Taiwan';
	}

	return countryCode.toUpperCase();
}

function buildCountryTooltip( country: CountrySummary ): string {
	const listed = country.locations.slice( 0, MAX_TOOLTIP_LOCATIONS );
	const lines = listed.map(
		location => `${ location.label }: ${ formatMetricValue( location.value ) }`
	);
	const remaining = country.locations.length - listed.length;

	if ( remaining > 0 ) {
		lines.push(
			sprintf(
				/* translators: %d is the number of locations left out of the tooltip list. */
				_n(
					'…and %d more location',
					'…and %d more locations',
					remaining,
					'jetpack-premium-analytics-pkg'
				),
				remaining
			)
		);
	}

	return lines.join( '<br />' );
}

function summarizeByCountry( rows: LocationsGeoRow[] ): [ string, CountrySummary ][] {
	const countryRows = new Map< string, CountrySummary >();

	rows.forEach( row => {
		const countryCode = row.countryCode.toUpperCase();
		const current = countryRows.get( countryCode );
		countryRows.set( countryCode, {
			countryFull: row.countryFull,
			value: ( current?.value ?? 0 ) + row.value,
			locations: [ ...( current?.locations ?? [] ), row ],
		} );
	} );

	return Array.from( countryRows.entries() );
}

/**
 * Build the GeoChart data and map scope for a set of location rows.
 *
 * Google GeoChart can only plot sub-country rows on a `provinces` map of a
 * single country, so every other case is summed back up to countries.
 *
 * @param args                      - Named arguments.
 * @param args.rows                 - The locations to plot.
 * @param args.mode                 - Granularity of the rows.
 * @param args.focusCountry         - The country the map is scoped to, if any.
 * @param args.provinceMapSupported - Whether Google has a provinces map for it.
 * @return The GeoChart `data`, `region`, and `resolution`.
 */
export function buildLocationsGeoChart( {
	rows,
	mode,
	focusCountry,
	provinceMapSupported = true,
}: BuildLocationsGeoChartArgs ): LocationsGeoChartConfig {
	const useProvinceMap = mode === 'region' && !! focusCountry && provinceMapSupported;
	// Recovery from a failed provinces draw leaves the country for the world map,
	// as the Locations widget has always done.
	const useCountryFallbackMap = mode === 'region' && !! focusCountry && ! useProvinceMap;
	const useCountrySummaryMap = mode === 'city' || ( mode === 'region' && ! focusCountry );
	const scope = {
		region: focusCountry && ! useCountryFallbackMap ? focusCountry.code.toUpperCase() : 'world',
		resolution: ( useProvinceMap ? 'provinces' : 'countries' ) as 'countries' | 'provinces',
	};

	// Only the provinces map plots sub-country rows; every other map is
	// country-scoped, whatever the rows beside it list.
	const header: GoogleDataTableColumn[] = [
		useProvinceMap
			? __( 'Location', 'jetpack-premium-analytics-pkg' )
			: __( 'Country', 'jetpack-premium-analytics-pkg' ),
		__( 'Views', 'jetpack-premium-analytics-pkg' ),
	];

	if ( useCountryFallbackMap && focusCountry ) {
		const countryCode = focusCountry.code.toUpperCase();
		const value = rows
			.filter( row => row.countryCode.toUpperCase() === countryCode )
			.reduce( ( total, row ) => total + row.value, 0 );

		return {
			...scope,
			data: [ header, [ { v: getGeoChartCountryId( countryCode ), f: focusCountry.name }, value ] ],
		};
	}

	if ( useCountrySummaryMap ) {
		// A summed country no longer names the regions behind its value, so it
		// carries them in a tooltip. Cities keep GeoChart's default tooltip.
		const withTooltips = mode === 'region';
		const summaryHeader: GoogleDataTableColumn[] = withTooltips
			? [
					...header,
					{ type: 'string', role: GoogleDataTableColumnRoleType.tooltip, p: { html: true } },
			  ]
			: header;

		return {
			...scope,
			data: [
				summaryHeader,
				...summarizeByCountry( rows ).map( ( [ countryCode, country ] ): GoogleDataTableRow => {
					const row: GoogleDataTableRow = [
						{ v: getGeoChartCountryId( countryCode ), f: country.countryFull },
						country.value,
					];

					return withTooltips ? [ ...row, buildCountryTooltip( country ) ] : row;
				} ),
			],
		};
	}

	return {
		...scope,
		data: [ header, ...rows.map( ( row ): GoogleDataTableRow => [ row.label, row.value ] ) ],
	};
}
