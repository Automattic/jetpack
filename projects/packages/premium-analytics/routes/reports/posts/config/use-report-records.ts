/**
 * External dependencies
 */
import {
	useStatsArchives,
	useStatsTopPosts,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { buildArchiveRows } from './fields';
import type { ReportPostsTabId } from './tabs';

/**
 * Fetch and derive the table records for the active report tab.
 *
 * @param activeTab    - The active Posts & Pages report tab.
 * @param reportParams - The shared report-window parameters.
 * @return Per-tab table records and request state.
 */
export function usePostsReportRecords( activeTab: ReportPostsTabId, reportParams: ReportParams ) {
	const isPostsTab = activeTab === 'posts-pages';

	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			period: 'day',
			summarize: 1,
			skip_archives: 1,
		} ),
		[ reportParams ]
	);
	const posts = useStatsTopPosts( recordsParams, { enabled: isPostsTab } );
	const archives = useStatsArchives( recordsParams, { enabled: ! isPostsTab } );

	const activeReport = isPostsTab ? posts : archives;
	const postRows = posts.comparisonRows?.rows ?? [];
	const archiveRows = useMemo(
		() => buildArchiveRows( archives.comparisonRows?.rows ?? [] ),
		[ archives.comparisonRows ]
	);

	return {
		isError: activeReport.isError,
		refetch: activeReport.refetch,
		posts: {
			rows: postRows,
			hasComparison: posts.hasComparison,
			isLoading: posts.isLoading,
			isFetching: posts.isFetching,
			isError: posts.isError,
		},
		archives: {
			rows: archiveRows,
			hasComparison: archives.hasComparison,
			isLoading: archives.isLoading,
			isFetching: archives.isFetching,
			isError: archives.isError,
		},
	};
}
