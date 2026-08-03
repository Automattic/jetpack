/**
 * External dependencies
 */
import {
	useStatsSingleVideo,
	type StatsSingleVideoResponse,
} from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { scheduled, seen, video } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { VideoDetailHighlightsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type VideoDetailHighlightsRenderAttributes = VideoDetailHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type VideoDetailHighlightsWidgetProps = WidgetRenderProps< VideoDetailHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const HOURS_FORMAT: DataFormat = {
	type: 'number',
	options: { decimals: 1 },
};

/**
 * Resolve the routed VideoPress attachment ID. Invalid or missing values keep
 * the data query disabled and show the widget's scope-empty descriptor.
 *
 * @param postId - The host-composed `reportParams.post_id` value.
 * @return A positive video ID, or `NaN` when no valid video is selected.
 */
function toVideoId( postId: string | number | undefined ): number {
	const parsed = typeof postId === 'number' ? postId : Number.parseInt( postId ?? '', 10 );

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : NaN;
}

/**
 * Sum the single-video endpoint's trailing 30-day metric series.
 *
 * The endpoint's `period=month` window contains 31 inclusive daily buckets,
 * so mirror Calypso by trimming the oldest bucket before calculating the total.
 *
 * @param report - A normalized single-video metric response.
 * @return The metric total for the trailing 30 days.
 */
export function sumVideoMetric( report: StatsSingleVideoResponse | undefined ): number {
	const data = report?.data ?? [];
	const trailingWindow = data.length > 30 ? data.slice( -30 ) : data;

	return trailingWindow.reduce( ( total, point ) => total + point.value, 0 );
}

/**
 * Read the selected video scope from WidgetRoot, fetch its three metric series,
 * and render their trailing-30-day totals through the shared tile grid.
 *
 * @return The video highlights widget content.
 */
function VideoDetailHighlightsInner() {
	const { reportParams } = useWidgetRootContext();
	const videoId = toVideoId( reportParams.post_id );
	const hasVideoScope = Number.isInteger( videoId );
	const views = useStatsSingleVideo( videoId, undefined, { enabled: hasVideoScope } );
	const impressions = useStatsSingleVideo(
		videoId,
		{ period: 'month', statType: 'impressions' },
		{ enabled: hasVideoScope }
	);
	const watchTime = useStatsSingleVideo(
		videoId,
		{ period: 'month', statType: 'watch_time' },
		{ enabled: hasVideoScope }
	);
	const queries = [ views, impressions, watchTime ];
	const isLoading = queries.some( query => query.isLoading );
	const isFetching = queries.some( query => query.isFetching );
	const isError = queries.some( query => query.isError );
	const hasData = queries.some( query => query.data?.data.length );
	const tiles = [
		{
			key: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			icon: seen,
			value: sumVideoMetric( views.data ),
		},
		{
			key: 'impressions',
			label: __( 'Impressions', 'jetpack-premium-analytics-pkg' ),
			icon: video,
			value: sumVideoMetric( impressions.data ),
		},
		{
			key: 'watch-time',
			label: __( 'Hours watched', 'jetpack-premium-analytics-pkg' ),
			icon: scheduled,
			value: sumVideoMetric( watchTime.data ),
			dataFormat: HOURS_FORMAT,
		},
	];

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ hasVideoScope && isLoading }
				isFetching={ isFetching }
				isError={ hasVideoScope && isError }
				isEmpty={ ! hasVideoScope || ( ! isLoading && ! isError && ! hasData ) }
				error={ {
					description: __(
						"We couldn't load this video's highlights. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [
						{
							label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
							onClick: () => {
								void Promise.all( queries.map( query => query.refetch() ) );
							},
						},
					],
				} }
				empty={ {
					icon: video,
					description: hasVideoScope
						? __( 'No highlights are available for this video.', 'jetpack-premium-analytics-pkg' )
						: __(
								'Open a video report to see its highlights here.',
								'jetpack-premium-analytics-pkg'
						  ),
				} }
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
			</WidgetState>
		</div>
	);
}

/**
 * Video highlights widget render entry point.
 *
 * @param {VideoDetailHighlightsWidgetProps} props - Widget host props.
 * @return The rendered widget.
 */
export default function VideoDetailHighlights( {
	attributes = {},
}: VideoDetailHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<VideoDetailHighlightsInner />
		</WidgetRoot>
	);
}
