/**
 * External dependencies
 */
import {
	hasComparisonEnabled,
	useStatsSearchTerms,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import {
	aggregateSearchTermRows,
	getSummarizedReportQueryParams,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * Fetch and derive the table records for the Search terms report.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Table records.
 */
export function useSearchTermsReportRecords( reportParams: ReportParams ) {
	const recordsParams = useMemo(
		() => getSummarizedReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const report = useStatsSearchTerms( recordsParams );
	const comparisonEnabled = hasComparisonEnabled( reportParams );
	const comparisonSettled =
		comparisonEnabled &&
		report.comparison.isSuccess &&
		! report.comparison.isFetching &&
		! report.comparison.isPlaceholderData &&
		! report.comparison.isError;
	const isFetching =
		report.primary.isFetching || ( comparisonEnabled && report.comparison.isFetching );

	const table = useMemo(
		() =>
			aggregateSearchTermRows(
				report.primary.data,
				comparisonSettled ? report.comparison.data : undefined
			),
		[ comparisonSettled, report.primary.data, report.comparison.data ]
	);

	return {
		// A comparison-only failure still renders the table with primary rows
		// and no deltas, via the comparisonSettled guard above.
		isError: report.primary.isError,
		refetch: report.refetch,
		table: {
			...table,
			isLoading: report.isLoading,
			isFetching,
			isError: report.primary.isError,
		},
	};
}
