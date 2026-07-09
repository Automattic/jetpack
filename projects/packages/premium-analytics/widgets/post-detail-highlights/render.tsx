/**
 * External dependencies
 */
import { useStatsPost } from '@jetpack-premium-analytics/data';
import {
	MetricValue,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { PostDetailHighlightsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The post scope and report params come from the detail page's URL through
// WidgetRoot; this widget reports lifetime totals and ignores the date range.
type PostDetailHighlightsRenderAttributes = PostDetailHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostDetailHighlightsWidgetProps = WidgetRenderProps< PostDetailHighlightsRenderAttributes >;

const METRIC_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

type MetricTileProps = {
	label: string;
	value: number;
};

/**
 * A single labelled metric value. This module reports lifetime totals with no
 * comparison period, so it renders the value directly with `MetricValue`.
 *
 * @param {MetricTileProps} props - The tile props.
 * @return The rendered metric tile.
 */
function MetricTile( { label, value }: MetricTileProps ) {
	return (
		<div className={ styles.metric }>
			<Text className={ styles.metricLabel } variant="body-md">
				{ label }
			</Text>
			<MetricValue className={ styles.metricValue } value={ value } dataFormat={ METRIC_FORMAT } />
		</div>
	);
}

/**
 * Post highlights inner component. Reads the post scope from WidgetRoot's
 * report params and fetches the post's lifetime totals from `stats/post`.
 *
 * @return The rendered widget content.
 */
function PostDetailHighlightsInner() {
	const { reportParams } = useWidgetRootContext();
	const postId = Number( reportParams.post_id ) || 0;

	// The query only enables for a positive post ID, so the scopeless state
	// below renders without firing a request.
	const { data, isLoading, isError } = useStatsPost( {
		postId,
		fields: [ 'views', 'like_count', 'post' ],
	} );

	if ( postId <= 0 ) {
		return (
			<div className={ styles.root }>
				<Text className={ styles.placeholder }>
					{ __(
						'Open a post or page report to see its all-time engagement here.',
						'jetpack-premium-analytics'
					) }
				</Text>
			</div>
		);
	}

	if ( isError ) {
		return (
			<div className={ styles.root }>
				<Text className={ styles.placeholder }>
					{ __( 'Unable to load post stats.', 'jetpack-premium-analytics' ) }
				</Text>
			</div>
		);
	}

	if ( isLoading && ! data ) {
		return (
			<div className={ styles.root }>
				<WidgetLoadingOverlay />
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			<div className={ styles.metrics }>
				<MetricTile
					label={ __( 'Views', 'jetpack-premium-analytics' ) }
					value={ data?.views ?? 0 }
				/>
				<MetricTile
					label={ __( 'Likes', 'jetpack-premium-analytics' ) }
					value={ data?.like_count ?? 0 }
				/>
				<MetricTile
					label={ __( 'Comments', 'jetpack-premium-analytics' ) }
					value={ Number( data?.post?.comment_count ) || 0 }
				/>
			</div>
		</div>
	);
}

/**
 * Post highlights widget: the scoped post's all-time views, likes, and
 * comments as labelled metric tiles. Ported from the Jetpack Stats post detail
 * "Highlights" section; the post's title, date, and featured image are owned
 * by the detail page's summary header.
 *
 * @param {PostDetailHighlightsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PostDetailHighlights( {
	attributes = {},
}: PostDetailHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostDetailHighlightsInner />
		</WidgetRoot>
	);
}
