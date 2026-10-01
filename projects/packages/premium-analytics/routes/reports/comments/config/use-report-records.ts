/**
 * External dependencies
 */
import { useStatsComments, type StatsCommentsResponse } from '@jetpack-premium-analytics/data';
import { toCommentRows, type CommentRow } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { CommentsReportTabId } from './tabs';

export type CommentReportRow = CommentRow;

/**
 * Fetch the all-time Comments report and expose the active tab's rows.
 *
 * @param activeTab - The active Comments report tab.
 * @return Table rows and loading state.
 */
export function useCommentsReportRecords( activeTab: CommentsReportTabId ) {
	const report = useStatsComments();

	const rows = useMemo(
		() => toCommentRows( report.data as StatsCommentsResponse | undefined, activeTab ),
		[ report.data, activeTab ]
	);

	return {
		rows,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
		isError: report.isError,
		refetch: report.refetch,
	};
}
