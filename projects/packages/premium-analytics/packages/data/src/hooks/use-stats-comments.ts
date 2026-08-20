/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { selectStatsCommentsRows } from '../processing/stats';
import { statsCommentsQuery } from '../queries/stats-comments-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsCommentsGroup, StatsCommentsRow } from '../processing/stats';
import type { StatsCommentsParams, StatsCommentsResponse } from '../queries/stats-comments-query';

export type { StatsCommentsParams, StatsCommentsResponse };

export function useStatsComments( params?: StatsCommentsParams, options?: UseStatsOptions ) {
	return useStatsQuery< StatsCommentsResponse >( statsCommentsQuery( params ), options );
}

export interface UseStatsCommentsRowsArgs {
	/**
	 * Which of the report's two groups to read: comment authors or commented
	 * posts and pages.
	 */
	group: StatsCommentsGroup;
	/**
	 * Maximum rows to return; `0` or omitted means all.
	 */
	max?: number;
}

export interface UseStatsCommentsRowsResult {
	rows: StatsCommentsRow[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
}

/**
 * Read one group of the all-time Comments report as flat, ranked rows.
 *
 * The endpoint returns both groups in a single response, so the two comment
 * widgets share one query and one row shape; only the label, media and link
 * treatment differ per widget.
 *
 * @param args       - Hook arguments.
 * @param args.group - Which of the report's two groups to read.
 * @param args.max   - Maximum rows to return; `0` or omitted means all.
 * @return The group's rows plus the query's data state.
 */
export function useStatsCommentsRows( {
	group,
	max,
}: UseStatsCommentsRowsArgs ): UseStatsCommentsRowsResult {
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsComments();

	// Memoize on the query's stable `data` reference so the row array keeps a
	// stable identity across unrelated re-renders; otherwise every render hands
	// a fresh array to the widget and defeats its downstream `useMemo`.
	const rows = useMemo( () => selectStatsCommentsRows( data, group, max ), [ data, group, max ] );

	// Only surface the error state when there is nothing to show, so a transient
	// refetch failure keeps the current rows visible. `error` is gated by the
	// same predicate so the two fields cannot disagree.
	const showError = rows.length === 0 && isError;

	return {
		rows,
		isLoading,
		isFetching,
		isError: showError,
		error: showError ? error : null,
		refetch,
	};
}
