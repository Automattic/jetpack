/**
 * External dependencies
 */
import {
	useStatsVideoPlays,
	type ReportParams,
	type StatsVideoPlaysComparisonItem,
} from '@jetpack-premium-analytics/data';
import { getVideosReportQueryParams } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

const EMPTY_VIDEO_ROWS: StatsVideoPlaysComparisonItem[] = [];

/**
 * Fetch the Videos report table from the range summary.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Table records and request state.
 */
export function useVideosReportRecords( reportParams: ReportParams ) {
	const summaryParams = useMemo(
		() => getVideosReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const summary = useStatsVideoPlays( summaryParams );

	return {
		isError: summary.primary.isError,
		error: summary.primary.error,
		refetch: summary.refetch,
		rows: summary.comparisonRows?.rows ?? EMPTY_VIDEO_ROWS,
		hasComparison: summary.hasComparison,
		isLoading: summary.isLoading,
		isFetching: summary.isFetching,
	};
}
