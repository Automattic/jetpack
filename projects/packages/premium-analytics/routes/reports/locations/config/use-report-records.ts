/**
 * External dependencies
 */
import {
	useStatsLocations,
	type ReportParams,
	type StatsChartBucketPeriod,
	type StatsLocationsItem,
	type StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateLocationRows, locationsToTimeSeries } from './aggregate';
import type { ReportLocationsTabId } from './tabs';

const GEO_MODES = {
	countries: 'country',
	regions: 'region',
	cities: 'city',
} as const;

/**
 * Fetch and derive chart and table records for the active Locations tab.
 *
 * @param activeTab    - The active Locations report tab.
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart bucket period.
 * @return Chart and table data for the active tab.
 */
export function useLocationsReportRecords(
	activeTab: ReportLocationsTabId,
	reportParams: ReportParams,
	chartPeriod: StatsChartBucketPeriod
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

	const countries = useStatsLocations(
		{ ...recordsParams, geoMode: GEO_MODES.countries },
		{ enabled: activeTab === 'countries' }
	);
	const regions = useStatsLocations(
		{ ...recordsParams, geoMode: GEO_MODES.regions },
		{ enabled: activeTab === 'regions' }
	);
	const cities = useStatsLocations(
		{ ...recordsParams, geoMode: GEO_MODES.cities },
		{ enabled: activeTab === 'cities' }
	);

	const reportsByTab = { countries, regions, cities };
	const activeReport = reportsByTab[ activeTab ];
	const primaryReport = activeReport.primary.data as
		| StatsNormalizedReport< StatsLocationsItem >
		| undefined;
	const comparisonReport = activeReport.comparison.data as
		| StatsNormalizedReport< StatsLocationsItem >
		| undefined;

	const chartPrimary = useMemo(
		() => locationsToTimeSeries( primaryReport, chartPeriod ),
		[ primaryReport, chartPeriod ]
	);
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return locationsToTimeSeries( comparisonReport, chartPeriod );
	}, [ comparisonReport, chartPeriod, reportParams.compare_from, reportParams.compare_to ] );
	const rows = useMemo( () => aggregateLocationRows( primaryReport ), [ primaryReport ] );

	return {
		chart: {
			primary: chartPrimary,
			comparison: activeReport.hasComparison ? chartComparison : undefined,
			isLoading: activeReport.isLoading,
		},
		table: {
			rows,
			isLoading: activeReport.isLoading,
		},
	};
}
