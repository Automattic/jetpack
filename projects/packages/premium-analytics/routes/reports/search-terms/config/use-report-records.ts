/**
 * External dependencies
 */
import {
	hasComparisonEnabled,
	isAwaitingData,
	useStatsSearchTerms,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { aggregateSearchTermRows } from './aggregate';

/**
 * Fetch and derive the table records for the Search terms report.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Table records.
 */
export function useSearchTermsReportRecords( reportParams: ReportParams ) {
	// Match legacy Stats' full custom-range request for client-side search, sort, and paging.
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 1,
			period: 'day',
		} ),
		[ reportParams ]
	);
	const report = useStatsSearchTerms( recordsParams );
	const unknownLabel = __( 'Unknown search terms', 'jetpack-premium-analytics-pkg' );
	const comparisonEnabled = hasComparisonEnabled( reportParams );
	const comparisonSettled =
		comparisonEnabled &&
		report.comparison.isSuccess &&
		! report.comparison.isFetching &&
		! report.comparison.isPlaceholderData &&
		! report.comparison.isError;
	const isLoading =
		isAwaitingData( report.primary ) ||
		( comparisonEnabled && isAwaitingData( report.comparison ) );
	const isFetching =
		report.primary.isFetching || ( comparisonEnabled && report.comparison.isFetching );

	const table = useMemo(
		() =>
			aggregateSearchTermRows(
				report.primary.data,
				unknownLabel,
				comparisonSettled ? report.comparison.data : undefined
			),
		[ comparisonSettled, report.primary.data, report.comparison.data, unknownLabel ]
	);

	return {
		// A comparison-only failure still renders the table with primary rows
		// and no deltas, via the comparisonSettled guard above.
		isError: report.primary.isError,
		refetch: report.refetch,
		table: {
			...table,
			isLoading,
			isFetching,
			isError: report.primary.isError,
		},
	};
}
