/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import {
	PostHighlightCard,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type PostHighlightCardMetric,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { useLatestPost } from './use-latest-post';
import type { LatestPostAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven, but this widget reports lifetime totals
// and ignores the date range; the host (and Storybook) may still inject them.
type LatestPostRenderAttributes = LatestPostAttributes & Partial< ReportParamsFieldAttributes >;
type LatestPostWidgetProps = WidgetRenderProps< LatestPostRenderAttributes >;

/**
 * Fetches the site's latest post (with its metrics) through `useLatestPost` and
 * hands it to the shared `PostHighlightCard`, with loading, error, and empty
 * states handled by `<WidgetState>`.
 *
 * Every tile is a lifetime total, so no tile carries an aggregation note.
 *
 * @return The widget content.
 */
function LatestPostReport() {
	const { post, isLoading, isFetching, isError, refetch } = useLatestPost();
	const { reportParams } = useWidgetRootContext();
	// The detail page opens on the dashboard's current window.
	const detailSearch = useMemo( () => pickReportDateParams( reportParams ), [ reportParams ] );

	const metrics: PostHighlightCardMetric[] = post
		? [
				{ key: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ), value: post.views },
				{
					key: 'likes',
					label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
					value: post.likeCount,
				},
				{
					key: 'comments',
					label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
					value: post.commentCount,
				},
		  ]
		: [];

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ isError }
			isEmpty={ ! post }
			error={ {
				description: __(
					"We couldn't load your latest post. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: postList,
				description: __( 'Publish a post to see its stats here.', 'jetpack-premium-analytics-pkg' ),
			} }
		>
			{ post && (
				<PostHighlightCard
					title={ post.title }
					url={ post.url }
					postId={ post.id }
					detailSearch={ detailSearch }
					date={ post.date }
					imageUrl={ post.imageUrl }
					imageAlt={ post.imageAlt }
					metrics={ metrics }
				/>
			) }
		</WidgetState>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme the inner card
 * relies on. This widget has no own attributes and ignores the dashboard date
 * range, but host attributes are still passed through for the widget contract.
 *
 * @param {LatestPostWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function LatestPost( { attributes = {} }: LatestPostWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<LatestPostReport />
		</WidgetRoot>
	);
}
