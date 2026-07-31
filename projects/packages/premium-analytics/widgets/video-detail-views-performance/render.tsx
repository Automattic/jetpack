/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import {
	ComparativeLineChart,
	WidgetRoot,
	WidgetState,
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
import useVideoViews, { type VideoViewsPoint } from './use-video-views';
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

/**
 * A series' legend label as its date range (first to last point), consistent
 * with the other comparative charts — used only when a comparison overlay
 * makes the plain "Views" label ambiguous.
 *
 * @param points - The series points, oldest first.
 * @return The formatted date range, or '' when empty.
 */
function rangeLabel( points: VideoViewsPoint[] ): string {
	const first = points[ 0 ];
	const last = points[ points.length - 1 ];
	return first && last ? formatDateRange( { from: first.date, to: last.date } ) : '';
}

type VideoDetailViewsPerformanceInnerProps = {
	/** The granularity attribute: the chart's bucket size. */
	granularity: VideoDetailViewsPerformanceGranularity;
};

/**
 * Views performance inner component. Reads the video scope and report params
 * from WidgetRoot context and renders the view-trend line through
 * `<WidgetState>`; without a video scope (e.g. the widget added outside a
 * video detail page) the queries never enable and the empty state shows.
 *
 * @param {VideoDetailViewsPerformanceInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function VideoDetailViewsPerformanceInner( {
	granularity,
}: VideoDetailViewsPerformanceInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const videoId = toPostId( reportParams.post_id );

	const { current, previous, isLoading, isFetching, isError, hasData, refetch } = useVideoViews(
		videoId,
		reportParams,
		granularity
	);

	const series = useMemo< ComparativeLineChartSeries[] >( () => {
		if ( ! current.length ) {
			return [];
		}

		if ( ! previous?.length ) {
			return [
				{
					label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
					group: 'views',
					data: current,
				},
			];
		}

		// With a comparison overlay both series are labelled by date range, so
		// the legend distinguishes the periods; the previous period draws as a
		// same-colour dashed line with no fill.
		return [
			{ label: rangeLabel( current ), group: 'views', data: current },
			{
				label: rangeLabel( previous ),
				group: 'views',
				data: previous,
				options: {
					type: 'comparison',
					gradient: { from: 'transparent', to: 'transparent', fromOpacity: 0, toOpacity: 0 },
				},
			},
		];
	}, [ current, previous ] );
	const seriesStyles = useSeriesStyles( series );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading && ! hasData }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ videoId <= 0 }
				error={ {
					description: __(
						"We couldn't load this video's views. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
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
 * date range as a comparative line chart. The view series comes from the
 * `stats/video/{id}` daily history for the selected window, zero-filled and
 * bucketed client-side per the granularity attribute; the comparison overlay
 * is fetched with a second window-scoped request.
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
