/**
 * External dependencies
 */
import {
	useStatsCommentFollowersAllPages,
	type StatsCommentFollowersItem,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';

/**
 * Fetch all comment-follower rows for client-side table controls.
 *
 * The endpoint is an all-time, server-paginated list. The data hook fetches
 * every endpoint page before the rows are passed to the client-side table.
 *
 * @return The table rows and loading state.
 */
export function useCommentFollowersReportRecords() {
	const report = useStatsCommentFollowersAllPages();

	const allRows = useMemo< StatsCommentFollowersItem[] >(
		() => report.data?.flatMap( page => page.data.flatMap( point => point.items ) ) ?? [],
		[ report.data ]
	);
	const { allPosts, rows } = useMemo(
		() => ( {
			allPosts: allRows.find( row => row.id === 0 ),
			rows: allRows.filter( row => row.id !== 0 ),
		} ),
		[ allRows ]
	);

	return {
		rows,
		allPostsFollowers: allPosts?.followers,
		isLoading: report.isLoading,
		isError: report.isError,
		refetch: report.refetch,
	};
}
