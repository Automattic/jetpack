/**
 * External dependencies
 */
import { useStatsFileDownloads, type ReportParams } from '@jetpack-premium-analytics/data';
import { getSummarizedReportQueryParams } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * Fetch and derive table data for the File downloads report.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Comparison-aware file records and request state.
 */
export function useDownloadsReportRecords( reportParams: ReportParams ) {
	const recordsParams = useMemo(
		() => getSummarizedReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const report = useStatsFileDownloads( recordsParams );

	return {
		isError: report.isError,
		error: report.error,
		refetch: report.refetch,
		rows: report.comparisonRows?.rows ?? [],
		hasComparison: report.hasComparison,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
	};
}
