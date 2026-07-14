/**
 * External dependencies
 */
import {
	useStatsCommentFollowers,
	type ReportParams,
	type StatsCommentFollowersItem,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';

/**
 * Fetch all comment-follower rows for client-side table controls.
 *
 * The endpoint is an all-time list rather than a date-bucketed report. Shared
 * report params remain part of the page contract, but the query factory sends
 * only the endpoint-supported pagination params (`max` and `page`).
 *
 * @param reportParams - The normalized shared report-window parameters.
 * @return The table rows and loading state.
 */
export function useCommentFollowersReportRecords( reportParams: ReportParams ) {
	// Keep the report-page data wiring consistent while `max: 0` requests every
	// row so DataViews can own search, sorting, and pagination client-side.
	const recordsParams = useMemo( () => ( { ...reportParams, max: 0 } ), [ reportParams ] );
	const report = useStatsCommentFollowers( recordsParams );

	const rows = useMemo< StatsCommentFollowersItem[] >(
		() => report.data?.data.flatMap( point => point.items ) ?? [],
		[ report.data ]
	);

	return {
		rows,
		isLoading: report.isLoading,
	};
}
