/**
 * External dependencies
 */
import {
	useStatsVideoPlays,
	type ReportParams,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateVideoRows, videosToTimeSeries } from './aggregate';

/**
 * Fetch and derive the Videos report chart and table from one bucketed query.
 *
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart's bucket period.
 * @return Chart data and table records.
 */
export function useVideosReportRecords(
	reportParams: ReportParams,
	chartPeriod: StatsChartBucketPeriod
) {
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: 'day',
			complete_stats: 1,
		} ),
		[ reportParams ]
	);
	const videos = useStatsVideoPlays( recordsParams );
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
	const rows = useMemo( () => aggregateVideoRows( primaryData ), [ primaryData ] );

	return {
		chart: {
			primary: chartPrimary,
			comparison: chartComparison,
			isLoading: videos.isLoading,
		},
		rows,
		isLoading: videos.isLoading,
	};
}
