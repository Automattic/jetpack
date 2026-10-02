/**
 * External dependencies
 */
import { useStatsLocations, type ReportParams } from '@jetpack-premium-analytics/data';
import {
	buildLocationRows,
	getLocationsReportQueryParams,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { LocationsCountryOption } from './fields';
import type { ReportLocationsTabId } from './tabs';

/**
 * Fetch and derive the table records for the active Locations tab.
 *
 * @param activeTab     - The active Locations report tab.
 * @param reportParams  - The shared report-window parameters.
 * @param countryFilter - ISO country code to scope regions/cities to, if any.
 * @return Table data for the active tab, plus the filter's countries.
 */
export function useLocationsReportRecords(
	activeTab: ReportLocationsTabId,
	reportParams: ReportParams,
	countryFilter?: string
) {
	const queryParams = useMemo( () => {
		const scope = countryFilter ? { country: countryFilter } : undefined;

		return {
			countries: getLocationsReportQueryParams( reportParams, 'countries' ),
			regions: getLocationsReportQueryParams( reportParams, 'regions', scope ),
			cities: getLocationsReportQueryParams( reportParams, 'cities', scope ),
		};
	}, [ reportParams, countryFilter ] );

	// Country rows serve two jobs: the Countries tab's own data, and the country
	// filter's options on the other two tabs. One always-enabled, never-filtered
	// query covers both, so picking a country does not shrink the list you pick
	// from.
	const countries = useStatsLocations( queryParams.countries );
	const regions = useStatsLocations( queryParams.regions, { enabled: activeTab === 'regions' } );
	const cities = useStatsLocations( queryParams.cities, { enabled: activeTab === 'cities' } );

	const reportsByTab = { countries, regions, cities };
	const activeReport = reportsByTab[ activeTab ];

	const rows = useMemo(
		() => buildLocationRows( activeReport.comparisonRows?.rows ),
		[ activeReport.comparisonRows ]
	);

	// Options keep the report's own order (views, descending) so the countries
	// a site actually gets traffic from sit at the top of the list.
	const countryOptions = useMemo(
		(): LocationsCountryOption[] =>
			buildLocationRows( countries.comparisonRows?.rows )
				.filter( ( row ): row is typeof row & { countryCode: string } => !! row.countryCode )
				.sort( ( a, b ) => b.views - a.views )
				.map( row => ( { code: row.countryCode, label: row.countryFull || row.label } ) ),
		[ countries.comparisonRows ]
	);

	return {
		table: {
			rows,
			isLoading: activeReport.isLoading,
			isFetching: activeReport.isFetching,
			// Not `activeReport.isError`: that folds in the comparison period,
			// whose failure costs deltas but must not hide the primary rows.
			isError: activeReport.primary.isError,
		},
		hasComparison: activeReport.hasComparison,
		countries: {
			options: countryOptions,
		},
		isError: activeReport.primary.isError,
		refetch: activeReport.refetch,
	};
}
