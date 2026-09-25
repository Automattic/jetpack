/**
 * External dependencies
 */
import { useStatsTopAuthors, type ReportParams } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateAuthorRows } from './aggregate';

/**
 * Fetch the same top-authors report used by Jetpack Stats and derive the
 * table's nested author and post rows.
 *
 * @param reportParams - The shared report-window parameters.
 * @return The author table rows, comparison availability, and request state.
 */
export function useAuthorsReportRecords( reportParams: ReportParams ) {
	/*
	 * Calypso's Jetpack Stats Authors report sends `max: 0` to
	 * `stats/top-authors`. With no chart requiring daily buckets, let the shared
	 * Stats query use its summarized range request. The hook's shared comparison
	 * mapper aligns authors and posts across periods before the hierarchy is
	 * flattened for the client-side table.
	 */
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
		} ),
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
