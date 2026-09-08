/**
 * External dependencies
 */
import { STATS_CHART_BUCKET_PERIODS, toPostId } from '@jetpack-premium-analytics/data';
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	defaultPeriodForInterval,
	describeError,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useVideoMetrics, { COUNT_FORMAT } from './use-video-metrics';
import type {
	VideoDetailViewsPerformanceAttributes,
	VideoDetailViewsPerformanceChartType,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type VideoDetailViewsPerformanceRenderAttributes = VideoDetailViewsPerformanceAttributes &
	Partial< ReportParamsFieldAttributes >;
type VideoDetailViewsPerformanceWidgetProps =
	WidgetRenderProps< VideoDetailViewsPerformanceRenderAttributes >;

type VideoDetailViewsPerformanceInnerProps = {
	/** How the selected metric is drawn. `MetricTabsChart` owns the default. */
	chartType?: VideoDetailViewsPerformanceChartType;
};

/**
 * Without a video scope (e.g. the widget added outside a video detail page) the
 * query never enables and the empty state shows.
 */
function VideoDetailViewsPerformanceInner( { chartType }: VideoDetailViewsPerformanceInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const videoId = toPostId( reportParams.post_id );
	const period = defaultPeriodForInterval( reportParams.interval, STATS_CHART_BUCKET_PERIODS );

	const { metrics, isLoading, isFetching, isError, error, refetch } = useVideoMetrics(
		videoId,
		reportParams,
		period
	);
	const groupLabel = __( 'Video metric', 'jetpack-premium-analytics-pkg' );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ videoId <= 0 }
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load this video's performance. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={ {
					icon: video,
					description: __(
						'Open a video report to see its performance here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
				// The chart is the whole content here, so its block replaces the
				// generic stacked lines.
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metrics }
					dataFormat={ COUNT_FORMAT }
					chartType={ chartType }
					groupLabel={ groupLabel }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Video performance widget: views, impressions, hours watched, and retention
 * rate as metric tabs. Comes from one `stats/video/{id}` `statType=all`
 * report, zero-filled and bucketed client-side.
 */
export default function VideoDetailViewsPerformance( {
	attributes = {},
}: VideoDetailViewsPerformanceWidgetProps ) {
	// Coerce unknown persisted values to the default.
	const chartType = attributes?.chartType === 'bar' ? 'bar' : 'line';

	return (
		<WidgetRoot attributes={ attributes }>
			<VideoDetailViewsPerformanceInner chartType={ chartType } />
		</WidgetRoot>
	);
}
