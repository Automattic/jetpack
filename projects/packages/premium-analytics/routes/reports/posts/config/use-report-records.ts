/**
 * External dependencies
 */
import {
	useStatsArchives,
	useStatsTopPosts,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import {
	buildArchiveRows,
	getPostsReportQueryParams,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
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
		() => getPostsReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const posts = useStatsTopPosts( recordsParams, { enabled: isPostsTab } );
	const archives = useStatsArchives( recordsParams, { enabled: ! isPostsTab } );

	const activeReport = isPostsTab ? posts : archives;
	const postRows = posts.comparisonRows?.rows ?? [];
	const archiveItems = useMemo(
		() => archives.comparisonRows?.rows ?? [],
		[ archives.comparisonRows ]
	);
	const archiveRows = useMemo( () => buildArchiveRows( archiveItems ), [ archiveItems ] );

	return {
		isError: activeReport.isError,
		error: activeReport.error,
		refetch: activeReport.refetch,
		posts: {
			rows: postRows,
			hasComparison: posts.hasComparison,
			isLoading: posts.isLoading,
			isFetching: posts.isFetching,
			isError: posts.isError,
		},
		archives: {
			items: archiveItems,
			rows: archiveRows,
			hasComparison: archives.hasComparison,
			isLoading: archives.isLoading,
			isFetching: archives.isFetching,
			isError: archives.isError,
		},
	};
}
