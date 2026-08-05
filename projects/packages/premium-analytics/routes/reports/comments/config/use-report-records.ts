/**
 * External dependencies
 */
import {
	selectStatsCommentsRows,
	useStatsComments,
	type StatsCommentsResponse,
} from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { CommentsReportTabId } from './tabs';

export type CommentReportRow = {
	id: string;
	label: string;
	value: number;
	avatarUrl?: string;
	link?: string;
	postId?: string;
};

/**
 * Fetch the all-time Comments report and expose the active tab's rows.
 *
 * @param activeTab - The active Comments report tab.
 * @return Table rows and loading state.
 */
export function useCommentsReportRecords( activeTab: CommentsReportTabId ) {
	const report = useStatsComments();

	const rows = useMemo< CommentReportRow[] >( () => {
		const rawRows = selectStatsCommentsRows(
			report.data as StatsCommentsResponse | undefined,
			activeTab
		);

		// Author links are built locally by the data layer (a root-relative
		// `edit-comments.php` search), so only the posts tab's remote permalinks
		// need the scheme guard. Row identity is left untouched: it can key on
		// the raw link, which must survive a rejected URL.
		if ( activeTab === 'authors' ) {
			return rawRows;
		}

		return rawRows.map( row => ( { ...row, link: safeHttpUrl( row.link ) ?? undefined } ) );
	}, [ report.data, activeTab ] );

	return {
		rows,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
		isError: report.isError,
		refetch: report.refetch,
	};
}
