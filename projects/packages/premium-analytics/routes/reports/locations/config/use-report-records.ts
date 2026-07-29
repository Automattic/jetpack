/**
 * External dependencies
 */
import {
	useStatsLocations,
	type ReportParams,
	type StatsLocationsItem,
	type StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateLocationRows } from './aggregate';
import type { LocationRow } from './fields';
import type { ReportLocationsTabId } from './tabs';

const GEO_MODES = {
	countries: 'country',
	regions: 'region',
	cities: 'city',
} as const;

/**
 * One selectable country in the report's country filter.
 */
export interface LocationsCountryOption {
	code: string;
	label: string;
}

/**
 * Fetch and derive map and table records for the active Locations tab.
 *
 * @param activeTab     - The active Locations report tab.
 * @param reportParams  - The shared report-window parameters.
 * @param countryFilter - ISO country code to scope regions/cities to, if any.
 * @return Map and table data for the active tab, plus the filter's countries.
 */
export function useLocationsReportRecords(
	activeTab: ReportLocationsTabId,
	reportParams: ReportParams,
	countryFilter?: string
) {
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: 'day',
		} ),
		[ reportParams ]
	);

	// Country rows serve two jobs: the Countries tab's own data, and the country
	// filter's options on the other two tabs. One always-enabled, never-filtered
	// query covers both, so picking a country does not shrink the list you pick
	// from.
	const countries = useStatsLocations( { ...recordsParams, geoMode: GEO_MODES.countries } );

	const scopedParams = useMemo(
		() => ( {
			...recordsParams,
			...( countryFilter ? { filter_by_country: countryFilter } : {} ),
		} ),
		[ recordsParams, countryFilter ]
	);

	const regions = useStatsLocations(
		{ ...scopedParams, geoMode: GEO_MODES.regions },
		{ enabled: activeTab === 'regions' }
	);
	const cities = useStatsLocations(
		{ ...scopedParams, geoMode: GEO_MODES.cities },
		{ enabled: activeTab === 'cities' }
	);

	const reportsByTab = { countries, regions, cities };
	const activeReport = reportsByTab[ activeTab ];
	const primaryReport = activeReport.primary.data as
		| StatsNormalizedReport< StatsLocationsItem >
		| undefined;

	const rows = useMemo( () => aggregateLocationRows( primaryReport ), [ primaryReport ] );

	const countriesReport = countries.primary.data as
		| StatsNormalizedReport< StatsLocationsItem >
		| undefined;

	// Options keep the report's own order (views, descending) so the countries
	// a site actually gets traffic from sit at the top of the list.
	const countryOptions = useMemo(
		(): LocationsCountryOption[] =>
			aggregateLocationRows( countriesReport )
				.filter( ( row ): row is LocationRow & { countryCode: string } => !! row.countryCode )
				.sort( ( a, b ) => b.views - a.views )
				.map( row => ( { code: row.countryCode, label: row.countryFull || row.label } ) ),
		[ countriesReport ]
	);

	return {
		table: {
			rows,
			isLoading: activeReport.isLoading,
		},
		countries: {
			options: countryOptions,
		},
		isError: activeReport.isError,
		refetch: activeReport.refetch,
	};
}
