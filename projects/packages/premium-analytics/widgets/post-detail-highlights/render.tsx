/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
	MetricTileGridSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { comment, seen, starEmpty } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePostHighlights from './use-post-highlights';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * The Post highlights widget has no configurable attributes: it always shows
 * the three highlight metrics of the post the page is scoped to (via
 * `reportParams.post_id`). `Record< never, never >` (not
 * `Record< string, never >`) so the render-only type can compose host fields
 * such as `reportParams` without collapsing them to `never`.
 */
export type PostDetailHighlightsAttributes = Record< never, never >;

type PostDetailHighlightsRenderAttributes = PostDetailHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostDetailHighlightsWidgetProps = WidgetRenderProps< PostDetailHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const ALL_TIME_NOTE = () =>
	__( 'All-time total — this metric has no per-post history.', 'jetpack-premium-analytics-pkg' );

/**
 * Without a post scope the query never enables and the empty state shows.
 * Comments and likes are lifetime totals, so under comparison their
 * `previousValue` is `null` — the tile keeps the layout but fabricates no delta.
 */
function PostDetailHighlightsInner() {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	const {
		views,
		viewsPrevious,
		comments,
		likes,
		hasComparison,
		isLoading,
		isFetching,
		isError,
		hasData,
		refetch,
	} = usePostHighlights( postId, reportParams );

	const tiles = useMemo(
		() => [
			{
				key: 'views',
				label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
				icon: seen,
				value: views,
				previousValue: viewsPrevious,
				note: __( 'Views in the selected date range.', 'jetpack-premium-analytics-pkg' ),
			},
			{
				key: 'likes',
				label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
				icon: starEmpty,
				value: likes,
				previousValue: hasComparison ? null : undefined,
				note: ALL_TIME_NOTE(),
			},
			{
				key: 'comments',
				label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
				icon: comment,
				value: comments,
				previousValue: hasComparison ? null : undefined,
				note: ALL_TIME_NOTE(),
			},
		],
		[ views, viewsPrevious, comments, likes, hasComparison ]
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The highlights stay on screen through a transient refetch failure, so
				// only surface the error when there is nothing to show.
				isError={ ! hasData && isError }
				isEmpty={ postId <= 0 }
				error={ {
					description: __(
						"We couldn't load this post's highlights. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					description: __(
						'Open a post or page report to see its highlights here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
				renderLoading={ <MetricTileGridSkeleton tiles={ tiles.length } /> }
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
			</WidgetState>
		</div>
	);
}

/**
 * The post detail Traffic view's highlights card: the scoped post's views,
 * comments, and likes as metric tiles. Views follow the dashboard date range;
 * comments and likes are lifetime totals, so their tiles carry a note, not a delta.
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
