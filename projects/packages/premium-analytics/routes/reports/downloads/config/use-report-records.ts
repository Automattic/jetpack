/**
 * External dependencies
 */
import { useStatsFileDownloads, type ReportParams } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';

/**
 * Fetch and derive table data for the File downloads report.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Comparison-aware file records and request state.
 */
export function useDownloadsReportRecords( reportParams: ReportParams ) {
	// Match the detailed Stats report request: summarize the selected day range
	// and request every file for client-side search, sorting, and pagination.
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 1,
			period: 'day',
		} ),
		[ reportParams ]
	);
	const report = useStatsFileDownloads( recordsParams );

	return {
		isError: report.isError,
		refetch: report.refetch,
		rows: report.comparisonRows?.rows ?? [],
		hasComparison: report.hasComparison,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
	};
}
