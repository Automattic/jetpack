/**
 * External dependencies
 */
import {
	useStatsVideoPlays,
	type StatsNormalizedReport,
	type StatsVideoPlaysItem,
} from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { percent, scheduled, seen, video } from '@wordpress/icons';
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
 * Find the selected video in a normalized complete-stats range summary.
 *
 * @param report  - The normalized video-plays report.
 * @param videoId - The selected VideoPress attachment ID.
 * @return The selected video's metrics, when present.
 */
export function selectVideoHighlights(
	report: StatsNormalizedReport< StatsVideoPlaysItem > | undefined,
	videoId: number
): StatsVideoPlaysItem | undefined {
	for ( const point of report?.data ?? [] ) {
		const row = point.items.find( item => Number( item.id ) === videoId );

		if ( row ) {
			return row;
		}
	}

	return undefined;
}

/**
 * Map a comparison metric to MetricTileGrid's three-state previous-value
 * contract while preserving zero as a real value.
 *
 * @param hasComparison - Whether the user requested a comparison window.
 * @param value         - The selected video's comparison metric.
 * @return A number for a matched row, null for an unmatched row, or undefined
 *         when comparison is off.
 */
function toPreviousValue( hasComparison: boolean, value?: number ): number | null | undefined {
	if ( ! hasComparison ) {
		return undefined;
	}

	return value ?? null;
}

/**
 * Read the selected video scope from WidgetRoot, fetch the complete Stats range
 * summary, and render its four metrics through the shared tile grid.
 *
 * @return The video highlights widget content.
 */
function VideoDetailHighlightsInner() {
	const { reportParams } = useWidgetRootContext();
	const videoId = toVideoId( reportParams.post_id );
	const hasVideoScope = Number.isInteger( videoId );
	const queryParams = useMemo(
		() => ( {
			...reportParams,
			complete_stats: 1,
			max: 0,
			period: 'day',
			summarize: 1,
		} ),
		[ reportParams ]
	);
	const { primary, comparison, isLoading, isFetching, isError, refetch } = useStatsVideoPlays(
		queryParams,
		{
			enabled: hasVideoScope,
		}
	);
	const row = useMemo(
		() => selectVideoHighlights( primary.data, videoId ),
		[ primary.data, videoId ]
	);
	const comparisonRow = useMemo(
		() => selectVideoHighlights( comparison.data, videoId ),
		[ comparison.data, videoId ]
	);
	// Mirror post-detail-highlights: `comp` is the report params contract's
	// comparison toggle. The hook's `hasComparison` is intentionally not used
	// because video row merging gates it on overlap across every returned video,
	// not whether the user requested a comparison window for this selected one.
	const hasComparison = reportParams.comp === '1';
	const comparisonRetentionRate = comparisonRow ? comparisonRow.retention_rate / 100 : undefined;
	const tiles = useMemo(
		() => [
			{
				key: 'views',
				label: __( 'Views', 'jetpack-premium-analytics' ),
				icon: seen,
				value: row?.plays ?? 0,
				previousValue: toPreviousValue( hasComparison, comparisonRow?.plays ),
			},
			{
				key: 'impressions',
				label: __( 'Impressions', 'jetpack-premium-analytics' ),
				icon: video,
				value: row?.impressions ?? 0,
				previousValue: toPreviousValue( hasComparison, comparisonRow?.impressions ),
			},
			{
				key: 'watch-time',
				label: __( 'Hours watched', 'jetpack-premium-analytics' ),
				icon: scheduled,
				value: row?.watch_time ?? 0,
				previousValue: toPreviousValue( hasComparison, comparisonRow?.watch_time ),
				dataFormat: HOURS_FORMAT,
			},
			{
				key: 'retention-rate',
				label: __( 'Retention rate', 'jetpack-premium-analytics' ),
				icon: percent,
				value: ( row?.retention_rate ?? 0 ) / 100,
				previousValue: toPreviousValue( hasComparison, comparisonRetentionRate ),
				dataFormat: RATE_FORMAT,
			},
		],
		[ row, comparisonRow, comparisonRetentionRate, hasComparison ]
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ hasVideoScope && isLoading }
				isFetching={ isFetching }
				isError={ hasVideoScope && ! row && isError }
				isEmpty={ ! hasVideoScope || ( ! isLoading && ! isError && ! row ) }
				error={ {
					description: __(
						"We couldn't load this video's highlights. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [
						{
							label: __( 'Retry', 'jetpack-premium-analytics' ),
							onClick: () => void refetch(),
						},
					],
				} }
				empty={ {
					icon: video,
					description: hasVideoScope
						? __( 'No highlights are available for this video.', 'jetpack-premium-analytics' )
						: __( 'Open a video report to see its highlights here.', 'jetpack-premium-analytics' ),
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
