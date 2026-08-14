/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import {
	MetricTabsChart,
	WidgetRoot,
	WidgetState,
	defaultPeriodForInterval,
	describeError,
	useWidgetRootContext,
	type MetricTab,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useVideoViews from './use-video-views';
import type { StatsChartBucketPeriod } from '@jetpack-premium-analytics/data';
import type {
	VideoDetailViewsPerformanceAttributes,
	VideoDetailViewsPerformanceChartType,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type VideoDetailViewsPerformanceRenderAttributes = VideoDetailViewsPerformanceAttributes &
	Partial< ReportParamsFieldAttributes >;
type VideoDetailViewsPerformanceWidgetProps =
	WidgetRenderProps< VideoDetailViewsPerformanceRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

// Ordered finest to coarsest, as `defaultPeriodForInterval` requires. The
// endpoint serves daily history; these are the buckets it is summed into.
const VIDEO_VIEWS_PERIODS = [
	'day',
	'week',
	'month',
] as const satisfies readonly StatsChartBucketPeriod[];

type VideoDetailViewsPerformanceInnerProps = {
	/** How the views series is drawn. `MetricTabsChart` owns the default. */
	chartType?: VideoDetailViewsPerformanceChartType;
};

/**
 * Without a video scope (e.g. the widget added outside a video detail page) the
 * query never enables and the empty state shows.
 */
function VideoDetailViewsPerformanceInner( { chartType }: VideoDetailViewsPerformanceInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const videoId = toPostId( reportParams.post_id );
	const period = defaultPeriodForInterval( reportParams.interval, VIDEO_VIEWS_PERIODS );

	const { current, isLoading, isFetching, isError, error, hasData, refetch } = useVideoViews(
		videoId,
		reportParams,
		period
	);

	// One "Views" metric: the headline is the window total (views are summed
	// per bucket, so the sum of buckets is the range's views). The video detail
	// page has no comparison control, so there is no previous series.
	const metricTabs = useMemo< MetricTab[] >(
		() => [
			{
				key: 'views',
				label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
				value: current.reduce( ( sum, point ) => sum + point.value, 0 ),
				current,
			},
		],
		[ current ]
	);
	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading && ! hasData }
				// `isFetching` is deliberately not passed: the chart renders its
				// own scoped overlay below, so WidgetState's full-widget one
				// would double up and cover the metric headline.
				isError={ isError }
				isEmpty={ videoId <= 0 }
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load this video's views. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={ {
					icon: video,
					description: __(
						'Open a video report to see its views here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					loading={ isFetching }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Views performance widget: the scoped video's view trend over the dashboard
 * date range, with the window total as the metric headline. The view series
 * comes from the `stats/video/{id}` daily history for the selected window,
 * zero-filled and bucketed client-side at the page's chart interval.
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
