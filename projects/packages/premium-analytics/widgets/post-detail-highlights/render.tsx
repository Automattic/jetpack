/**
 * External dependencies
 */
import { reports } from '@jetpack-premium-analytics/icons';
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
import { comment, seen, starEmpty } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePostHighlights from './use-post-highlights';
import type { PostDetailHighlightsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostDetailHighlightsRenderAttributes = PostDetailHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostDetailHighlightsWidgetProps = WidgetRenderProps< PostDetailHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const ALL_TIME_NOTE = () =>
	__( 'All-time total — this metric has no per-post history.', 'jetpack-premium-analytics' );

/**
 * Post highlights inner component. Reads the post scope and report params
 * from WidgetRoot context and renders the three highlight metrics as a
 * `MetricTileGrid` through `<WidgetState>`; without a post scope (e.g. the
 * widget added outside a post detail page) the query never enables and the
 * empty state shows.
 *
 * Views is period-scoped with a period-over-period delta when comparison is
 * on. Comments and likes are lifetime totals: when comparison is on their
 * `previousValue` is `null` — the tile keeps the comparison layout but shows
 * no fabricated delta.
 *
 * @return The rendered widget content.
 */
function PostDetailHighlightsInner() {
	const { reportParams } = useWidgetRootContext();
	const postId = Number( reportParams.post_id ) || 0;

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
				label: __( 'Views', 'jetpack-premium-analytics' ),
				icon: seen,
				value: views,
				previousValue: viewsPrevious,
				note: __( 'Views in the selected date range.', 'jetpack-premium-analytics' ),
			},
			{
				key: 'comments',
				label: __( 'Comments', 'jetpack-premium-analytics' ),
				icon: comment,
				value: comments,
				previousValue: hasComparison ? null : undefined,
				note: ALL_TIME_NOTE(),
			},
			{
				key: 'likes',
				label: __( 'Likes', 'jetpack-premium-analytics' ),
				icon: starEmpty,
				value: likes,
				previousValue: hasComparison ? null : undefined,
				note: ALL_TIME_NOTE(),
			},
		],
		[ views, viewsPrevious, comments, likes, hasComparison ]
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading && ! hasData }
				isFetching={ isFetching }
				// As with `isLoading` above: the highlights stay on screen through a
				// transient refetch failure, so only surface the error when there is
				// nothing to show.
				isError={ ! hasData && isError }
				isEmpty={ postId <= 0 }
				error={ {
					description: __(
						"We couldn't load this post's highlights. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __(
						'Open a post or page report to see its highlights here.',
						'jetpack-premium-analytics'
					),
				} }
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
			</WidgetState>
		</div>
	);
}

/**
 * Post highlights widget: the scoped post's views, comments, and likes as
 * metric tiles — the post detail Traffic view's highlights card.
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
