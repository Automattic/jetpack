/**
 * External dependencies
 */
import {
	useStatsFileDownloads,
	type ReportParams,
	type StatsFileDownloadsItem,
	type StatsNormalizedReport,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateDownloadRows, downloadsToTimeSeries } from './aggregate';

/**
 * Fetch and derive chart and table data for the File downloads report.
 *
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart bucket period.
 * @return Chart data and aggregated file records.
 */
export function useDownloadsReportRecords( reportParams: ReportParams, chartPeriod: StatsPeriod ) {
	// One unsummarized query supplies both the interval chart and the complete
	// client-side table. `max: 0` requests every file row.
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: chartPeriod,
		} ),
		[ reportParams, chartPeriod ]
	);
	const report = useStatsFileDownloads( recordsParams );

	const chartPrimary = useMemo(
		() =>
			downloadsToTimeSeries(
				report.primary.data as StatsNormalizedReport< StatsFileDownloadsItem > | undefined
			),
		[ report.primary.data ]
	);
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return downloadsToTimeSeries(
			report.comparison.data as StatsNormalizedReport< StatsFileDownloadsItem > | undefined
		);
	}, [ reportParams, report.comparison.data ] );
	const rows = useMemo(
		() =>
			aggregateDownloadRows(
				report.primary.data as StatsNormalizedReport< StatsFileDownloadsItem > | undefined
			),
		[ report.primary.data ]
	);

	return {
		chart: {
			primary: chartPrimary,
			comparison: report.hasComparison ? chartComparison : undefined,
			isLoading: report.isLoading,
		},
		rows,
		isLoading: report.isLoading,
	};
}
