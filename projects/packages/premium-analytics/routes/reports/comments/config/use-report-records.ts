/**
 * External dependencies
 */
import {
	useStatsComments,
	type StatsCommentsResponse,
	type StatsCommentsRow,
} from '@jetpack-premium-analytics/data';
import { toCommentRows } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { CommentsReportTabId } from './tabs';

export type CommentReportRow = StatsCommentsRow;

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
		error: report.error,
		refetch: report.refetch,
	};
}
