/**
 * External dependencies
 */
import { STATS_CHART_BUCKET_PERIODS, toPostId } from '@jetpack-premium-analytics/data';
import {
	HEADLINE_COUNT_FORMAT,
	ChartEmptyState,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	defaultPeriodForInterval,
	describeError,
	metricTabsToCsv,
	useReportActions,
	useWidgetRootContext,
	type MetricTab,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useVideoMetrics from './use-video-metrics';
import type {
	VideoDetailViewsPerformanceAttributes,
	VideoDetailViewsPerformanceChartType,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type VideoDetailViewsPerformanceRenderAttributes = VideoDetailViewsPerformanceAttributes &
	Partial< ReportParamsFieldAttributes >;
type VideoDetailViewsPerformanceWidgetProps =
	WidgetRenderProps< VideoDetailViewsPerformanceRenderAttributes >;

// The chart reads the rate as a 0 to 1 ratio; the file writes the percentage it shows.
function retentionAsPercent( tab: MetricTab ): MetricTab {
	return tab.key === 'retention-rate'
		? {
				...tab,
				label: __( 'Retention rate (%)', 'jetpack-premium-analytics-pkg' ),
				current: tab.current.map( point => ( {
					...point,
					// toPrecision drops the float noise of the multiplication (0.453 * 100).
					value: point.value === null ? null : Number( ( point.value * 100 ).toPrecision( 12 ) ),
				} ) ),
			}
		: tab;
}

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

	const { metrics, timezone, isLoading, isFetching, isError, error, refetch } = useVideoMetrics(
		videoId,
		reportParams,
		period
	);
	const csv = useMemo(
		() =>
			metricTabsToCsv(
				metrics.some( tab => tab.current.some( point => ( point.value ?? 0 ) > 0 ) )
					? metrics.map( retentionAsPercent )
					: [],
				{
					zone: timezone,
					withTime: false,
					dateLabel: __( 'Date', 'jetpack-premium-analytics-pkg' ),
				}
			),
		[ metrics, timezone ]
	);
	useReportActions( {
		csv: {
			...csv,
			filenamePrefix: `video-${ videoId }-performance`,
			range: { from: reportParams.from, to: reportParams.to },
			status: { isLoading, isFetching, isError },
		},
	} );
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
					dataFormat={ HEADLINE_COUNT_FORMAT }
					chartType={ chartType }
					groupLabel={ groupLabel }
					empty={ <ChartEmptyState /> }
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
	const chartType = attributes?.chartType === 'line' ? 'line' : 'bar';

	return (
		<WidgetRoot attributes={ attributes }>
			<VideoDetailViewsPerformanceInner chartType={ chartType } />
		</WidgetRoot>
	);
}
