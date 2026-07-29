/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type {
	GeoData,
	GeoResolution,
	GoogleDataTableColumn,
	GoogleDataTableRow,
} from '@automattic/charts';

/**
 * How a Locations surface groups its rows.
 */
export type LocationsGeoMode = 'country' | 'region' | 'city';

/**
 * A country a Locations surface has drilled into.
 */
export interface LocationsGeoCountry {
	code: string;
	name: string;
}

/**
 * One location row, in the minimal shape the map needs.
 *
 * Both the Locations widget and the Locations report page map their own row
 * types onto this before building the map.
 */
export interface LocationsGeoChartRow {
	label: string;
	countryCode: string;
	countryFull: string;
	value: number;
}

interface BuildLocationsMapViewArgs {
	rows: LocationsGeoChartRow[];
	geoMode: LocationsGeoMode;
	/**
	 * The drilled-into country, when the surface supports drill-down.
	 */
	selectedCountry?: LocationsGeoCountry;
	/**
	 * Countries whose provinces map failed to draw. See
	 * `LocationsGeoChart` for how this set is learned at runtime.
	 */
	unsupportedProvinceMapCountries?: ReadonlySet< string >;
}

/**
 * Everything `<GeoChart>` needs to draw a Locations map.
 */
export interface LocationsMapView {
	data: GeoData;
	region: string;
	resolution: GeoResolution;
	/**
	 * Whether the view draws the provinces map of `selectedCountry`. The caller
	 * needs this to attribute a draw error to that country.
	 */
	usesProvinceMap: boolean;
}

/**
 * Map a country code to the identifier Google GeoChart resolves.
 *
 * Google's geo data keys Taiwan by name rather than by its ISO code, so the
 * code alone leaves the region unmatched and uncoloured.
 *
 * @param countryCode - An ISO 3166-1 alpha-2 country code.
 * @return The identifier to send to Google GeoChart.
 */
export function getGeoChartCountryId( countryCode: string ): string {
	if ( countryCode.toUpperCase() === 'TW' ) {
		return 'Taiwan';
	}

	return countryCode.toUpperCase();
}

/**
 * Sum every row onto its country, preserving first-seen country order.
 *
 * @param rows - The location rows to aggregate.
 * @return One entry per country code, with views summed.
 */
function aggregateRowsByCountry(
	rows: LocationsGeoChartRow[]
): [ string, { countryFull: string; value: number } ][] {
	const countryRows = new Map< string, { countryFull: string; value: number } >();

	rows.forEach( row => {
		const countryCode = row.countryCode.toUpperCase();
		const current = countryRows.get( countryCode );

		countryRows.set( countryCode, {
			countryFull: row.countryFull,
			value: ( current?.value ?? 0 ) + row.value,
		} );
	} );

	return Array.from( countryRows.entries() );
}

/**
 * Build the Google GeoChart data table and map options for a Locations view.
 *
 * The view a surface gets depends on how much geography its rows describe:
 *
 * - `country` — one row per country, drawn on the world map.
 * - `region` with a selected country whose provinces map exists — the region
 *   rows drawn on that country's provinces map, zoomed to it.
 * - `region` with a selected country whose provinces map does not exist — that
 *   single country, still zoomed to it, so the view resolves without Google's
 *   missing provinces file.
 * - `city` with a selected country — the country's own cities summed onto it,
 *   zoomed to that country. Google resolves no city names on a choropleth and
 *   our `GeoChart` has no marker mode, so the map is context for the table
 *   rather than a per-city view.
 * - no selected country — rows summed onto their countries and drawn on the
 *   world map. Region and city names are not resolvable on a world map, and
 *   Google exposes no worldwide sub-country map, so the country roll-up is the
 *   only view that can render.
 *
 * @param args                                 - The rows and the surface's current geo state.
 * @param args.rows                            - The location rows to draw.
 * @param args.geoMode                         - How the rows are grouped.
 * @param args.selectedCountry                 - The drilled-into country, if any.
 * @param args.unsupportedProvinceMapCountries - Countries with no provinces map.
 * @return The data table, map options, and whether a provinces map is drawn.
 */
export function buildLocationsMapView( {
	rows,
	geoMode,
	selectedCountry,
	unsupportedProvinceMapCountries,
}: BuildLocationsMapViewArgs ): LocationsMapView {
	const selectedCountryCode = selectedCountry?.code.toUpperCase();
	const usesProvinceMap =
		geoMode === 'region' &&
		!! selectedCountryCode &&
		! unsupportedProvinceMapCountries?.has( selectedCountryCode );
	// Once a country is chosen the map zooms to it, whether or not Google has a
	// provinces file for it. Without the zoom a single shaded country sits on a
	// world map, which reads as an error rather than a filter.
	const usesCountryFallback = !! selectedCountry && ! usesProvinceMap;
	const usesCountryRollup = ! selectedCountry && geoMode !== 'country';

	// Only the provinces map lists sub-country places; every other view
	// resolves to whole countries.
	const header: GoogleDataTableColumn[] = [
		usesProvinceMap
			? __( 'Location', 'jetpack-premium-analytics-pkg' )
			: __( 'Country', 'jetpack-premium-analytics-pkg' ),
		__( 'Views', 'jetpack-premium-analytics-pkg' ),
	];
	const region = selectedCountry?.code ?? 'world';
	const resolution: GeoResolution = usesProvinceMap ? 'provinces' : 'countries';

	if ( usesCountryFallback && selectedCountry ) {
		const countryCode = selectedCountry.code.toUpperCase();
		const value = rows
			.filter( row => row.countryCode.toUpperCase() === countryCode )
			.reduce( ( total, row ) => total + row.value, 0 );

		return {
			data: [
				header,
				[ { v: getGeoChartCountryId( countryCode ), f: selectedCountry.name }, value ],
			],
			region,
			resolution,
			usesProvinceMap,
		};
	}

	if ( usesCountryRollup ) {
		return {
			data: [
				header,
				...aggregateRowsByCountry( rows ).map(
					( [ countryCode, row ] ): GoogleDataTableRow => [
						{ v: getGeoChartCountryId( countryCode ), f: row.countryFull },
						row.value,
					]
				),
			],
			region,
			resolution,
			usesProvinceMap,
		};
	}

	// Country mode sends country names and the provinces map sends region
	// names; Google resolves both from the label.
	return {
		data: [ header, ...rows.map( ( row ): GoogleDataTableRow => [ row.label, row.value ] ) ],
		region,
		resolution,
		usesProvinceMap,
	};
}
