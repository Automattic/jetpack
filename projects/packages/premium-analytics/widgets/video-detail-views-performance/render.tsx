/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import {
	ComparativeLineChart,
	WidgetRoot,
	WidgetState,
	describeError,
	useSeriesStyles,
	useWidgetRootContext,
	type ComparativeLineChartSeries,
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
import type {
	VideoDetailViewsPerformanceAttributes,
	VideoDetailViewsPerformanceGranularity,
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

type VideoDetailViewsPerformanceInnerProps = {
	/** The granularity attribute: the chart's bucket size. */
	granularity: VideoDetailViewsPerformanceGranularity;
};

/**
 * Views performance inner component. Reads the video scope and report params
 * from WidgetRoot context and renders the view-trend line through
 * `<WidgetState>`; without a video scope (e.g. the widget added outside a
 * video detail page) the query never enables and the empty state shows.
 *
 * @param {VideoDetailViewsPerformanceInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function VideoDetailViewsPerformanceInner( {
	granularity,
}: VideoDetailViewsPerformanceInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const videoId = toPostId( reportParams.post_id );

	const { current, isLoading, isFetching, isError, error, hasData, refetch } = useVideoViews(
		videoId,
		reportParams,
		granularity
	);

	// The video detail page has no comparison control, so the chart always
	// draws the single "Views" series.
	const series = useMemo< ComparativeLineChartSeries[] >( () => {
		if ( ! current.length ) {
			return [];
		}

		return [
			{
				label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
				group: 'views',
				data: current,
			},
		];
	}, [ current ] );
	const seriesStyles = useSeriesStyles( series );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading && ! hasData }
				isFetching={ isFetching }
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
				<ComparativeLineChart
					className={ styles.chart }
					series={ series }
					styles={ seriesStyles }
					dataFormat={ DATA_FORMAT }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Views performance widget: the scoped video's view trend over the dashboard
 * date range as a line chart. The view series comes from the
 * `stats/video/{id}` daily history for the selected window, zero-filled and
 * bucketed client-side per the granularity attribute.
 *
 * @param {VideoDetailViewsPerformanceWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function VideoDetailViewsPerformance( {
	attributes = {},
}: VideoDetailViewsPerformanceWidgetProps ) {
	// Coerce unknown persisted values to the default.
	const attrGranularity = attributes?.granularity;
	const granularity =
		attrGranularity === 'week' || attrGranularity === 'month' ? attrGranularity : 'day';

	return (
		<WidgetRoot attributes={ attributes }>
			<VideoDetailViewsPerformanceInner granularity={ granularity } />
		</WidgetRoot>
	);
}
