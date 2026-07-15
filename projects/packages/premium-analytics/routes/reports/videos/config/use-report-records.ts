/**
 * External dependencies
 */
import {
	useStatsVideoPlays,
	useStatsVideoPlaysSummary,
	type ReportParams,
	type StatsChartBucketPeriod,
	type StatsVideoPlaysSummaryItem,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { videosToTimeSeries } from './aggregate';

const EMPTY_VIDEO_ROWS: StatsVideoPlaysSummaryItem[] = [];

/**
 * Fetch the Videos report chart from daily plays and its table from the range summary.
 *
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart's bucket period.
 * @return Chart data and table records.
 */
export function useVideosReportRecords(
	reportParams: ReportParams,
	chartPeriod: StatsChartBucketPeriod
) {
	const chartParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: 'day',
		} ),
		[ reportParams ]
	);
	const videos = useStatsVideoPlays( chartParams );
	const summary = useStatsVideoPlaysSummary( reportParams );
	const primaryData = videos.primary.data;
	const comparisonData = videos.comparison.data;

	const chartPrimary = useMemo(
		() => videosToTimeSeries( primaryData, chartPeriod ),
		[ primaryData, chartPeriod ]
	);
	const chartComparison = useMemo( () => {
		if ( ! videos.hasComparison ) {
			return undefined;
		}

		return videosToTimeSeries( comparisonData, chartPeriod );
	}, [ videos.hasComparison, comparisonData, chartPeriod ] );

	return {
		chart: {
			primary: chartPrimary,
			comparison: chartComparison,
			isLoading: videos.isLoading,
		},
		rows: summary.data?.data ?? EMPTY_VIDEO_ROWS,
		isLoading: summary.isLoading,
	};
}
