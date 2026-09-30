/**
 * External dependencies
 */
import { useStatsTopAuthors, type ReportParams } from '@jetpack-premium-analytics/data';
import {
	aggregateAuthorRows,
	getAuthorsReportQueryParams,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * Fetch the same top-authors report used by Jetpack Stats and derive the
 * table's nested author and post rows.
 *
 * @param reportParams - The shared report-window parameters.
 * @return The author table rows, comparison availability, and request state.
 */
export function useAuthorsReportRecords( reportParams: ReportParams ) {
	// Calypso's Authors report sends max: 0; the shared mapper aligns authors and posts across periods.
	const recordsParams = useMemo(
		() => getAuthorsReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const authors = useStatsTopAuthors( recordsParams );
	const rows = useMemo(
		() =>
			aggregateAuthorRows(
				authors.comparisonRows ? { data: [ { items: authors.comparisonRows.rows } ] } : undefined
			),
		[ authors.comparisonRows ]
	);

	return {
		isError: authors.isError,
		refetch: authors.refetch,
		rows,
		hasComparison: authors.hasComparison,
		isLoading: authors.isLoading,
		isFetching: authors.isFetching,
	};
}
