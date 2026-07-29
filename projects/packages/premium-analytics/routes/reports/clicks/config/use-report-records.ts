/**
 * External dependencies
 */
import { useStatsClicks, type ReportParams } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateClickRows } from './aggregate';

/**
 * Fetch and derive the Clicks table records.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Nested clicked-URL rows.
 */
export function useClicksReportRecords( reportParams: ReportParams ) {
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 1,
			period: 'day',
		} ),
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
		refetch: report.refetch,
		rows,
		hasComparison: report.hasComparison,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
	};
}
