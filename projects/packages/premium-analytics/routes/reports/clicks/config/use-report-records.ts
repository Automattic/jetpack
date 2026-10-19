/**
 * External dependencies
 */
import { useStatsClicks, type ReportParams } from '@jetpack-premium-analytics/data';
import {
	aggregateClickRows,
	getSummarizedReportQueryParams,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * Fetch and derive the Clicks table records.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Nested clicked-URL rows.
 */
export function useClicksReportRecords( reportParams: ReportParams ) {
	const recordsParams = useMemo(
		() => getSummarizedReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const report = useStatsClicks( recordsParams );
	const comparisonRows = report.comparisonRows?.rows;
	const rows = useMemo(
		() => aggregateClickRows( { data: [ { items: comparisonRows ?? [] } ] } ),
		[ comparisonRows ]
	);

	return {
		isError: report.isError,
		error: report.error,
		refetch: report.refetch,
		rows,
		hasComparison: report.hasComparison,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
	};
}
