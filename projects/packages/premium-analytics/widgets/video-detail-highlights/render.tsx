/**
 * External dependencies
 */
import { toPostId, useStatsSingleVideo } from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
	WidgetRoot,
	WidgetState,
	describeError,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { scheduled, seen, trendingUp, video } from '@wordpress/icons';
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

const RATE_FORMAT: DataFormat = {
	type: 'percentage',
	options: { decimals: 1, signDisplay: 'never' },
};

/**
 * Read the selected video scope from WidgetRoot, fetch one `statType=all`
 * range report, and render its server-computed window totals through the
 * shared tile grid.
 *
 * @return The video highlights widget content.
 */
function VideoDetailHighlightsInner() {
	const { reportParams } = useWidgetRootContext();
	// The shared resolver returns 0 for an invalid or missing scope, which also
	// keeps the query's own `enabled` guard off.
	const videoId = toPostId( reportParams.post_id );
	const hasVideoScope = videoId > 0;
	// One `statType=all` request scoped to the page's range (wpcom #229903):
	// the response carries every metric series plus canonical `total`s over the
	// requested window, including the play-weighted retention rate the
	// per-metric series cannot derive. The Views performance widget issues the
	// same request, so the two widgets share one cache entry. Comparison
	// params never reach the request — the query factory maps only the range
	// params, and this hook fetches no comparison window.
	const queryParams = useMemo(
		() => ( {
			from: reportParams.from,
			to: reportParams.to,
			period: 'day' as const,
			statType: 'all' as const,
		} ),
		[ reportParams.from, reportParams.to ]
	);
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsSingleVideo(
		videoId,
		queryParams,
		{ enabled: hasVideoScope }
	);
	const total = data?.total;
	// A metric missing from the response's `fields` is unknown, not a measured
	// zero — `null` lets the tile render its placeholder instead of fake data.
	const tiles = [
		{
			key: 'impressions',
			label: __( 'Impressions', 'jetpack-premium-analytics-pkg' ),
			icon: seen,
			value: total?.impressions ?? null,
		},
		{
			key: 'watch-time',
			label: __( 'Hours watched', 'jetpack-premium-analytics-pkg' ),
			icon: scheduled,
			value: total?.watch_time ?? null,
			dataFormat: HOURS_FORMAT,
		},
		{
			key: 'retention-rate',
			label: __( 'Retention rate', 'jetpack-premium-analytics-pkg' ),
			icon: trendingUp,
			value: total?.retention_rate === undefined ? null : total.retention_rate / 100,
			dataFormat: RATE_FORMAT,
		},
	];

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ hasVideoScope && isLoading }
				isFetching={ isFetching }
				isError={ hasVideoScope && isError }
				isEmpty={ ! hasVideoScope || ( ! isLoading && ! isError && ! total ) }
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load this video's highlights. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
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
