/**
 * External dependencies
 */
import {
	useStatsFileDownloads,
	type ReportParams,
	type StatsChartBucketPeriod,
	type StatsFileDownloadsItem,
	type StatsNormalizedReport,
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
export function useDownloadsReportRecords(
	reportParams: ReportParams,
	chartPeriod: StatsChartBucketPeriod
) {
	// One unsummarized query supplies both the interval chart and the complete
	// client-side table. `max: 0` requests every file row.
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: 'day',
		} ),
		[ reportParams ]
	);
	const report = useStatsFileDownloads( recordsParams );
	const primaryData = report.primary.data;
	const comparisonData = report.comparison.data;

	const chartPrimary = useMemo(
		() =>
			downloadsToTimeSeries(
				primaryData as StatsNormalizedReport< StatsFileDownloadsItem > | undefined,
				chartPeriod
			),
		[ primaryData, chartPeriod ]
	);
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return downloadsToTimeSeries(
			comparisonData as StatsNormalizedReport< StatsFileDownloadsItem > | undefined,
			chartPeriod
		);
	}, [ reportParams, comparisonData, chartPeriod ] );
	const rows = useMemo(
		() =>
			aggregateDownloadRows(
				primaryData as StatsNormalizedReport< StatsFileDownloadsItem > | undefined
			),
		[ primaryData ]
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
