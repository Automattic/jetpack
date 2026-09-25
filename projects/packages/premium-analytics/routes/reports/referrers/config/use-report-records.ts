/**
 * External dependencies
 */
import { useStatsReferrers, type ReportParams } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { flattenReferrerRows } from './aggregate';

/**
 * Fetch and derive the Referrers report table records.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Hierarchical table records.
 */
export function useReferrersReportRecords( reportParams: ReportParams ) {
	// Match Calypso's detailed Referrers request: summarize the selected day
	// range and request every row for client-side search, sorting, and pagination.
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 1,
			period: 'day',
		} ),
		[ reportParams ]
	);
	const report = useStatsReferrers( recordsParams );
	const comparisonRows = report.comparisonRows?.rows;
	const rows = useMemo( () => flattenReferrerRows( comparisonRows ?? [] ), [ comparisonRows ] );

	return {
		isError: report.isError,
		refetch: report.refetch,
		rows,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
	};
}
