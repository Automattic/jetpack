/**
 * External dependencies
 */
import { useStatsReferrers, type ReportParams } from '@jetpack-premium-analytics/data';
import {
	flattenReferrerRows,
	getSummarizedReportQueryParams,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * Fetch and derive the Referrers report table records.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Hierarchical table records.
 */
export function useReferrersReportRecords( reportParams: ReportParams ) {
	const recordsParams = useMemo(
		() => getSummarizedReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const report = useStatsReferrers( recordsParams );
	const comparisonRows = report.comparisonRows?.rows;
	const rows = useMemo( () => flattenReferrerRows( comparisonRows ?? [] ), [ comparisonRows ] );

	return {
		isError: report.isError,
		error: report.error,
		refetch: report.refetch,
		rows,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
	};
}
