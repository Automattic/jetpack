/**
 * External dependencies
 */
import {
	PostHighlightCard,
	WidgetRoot,
	WidgetState,
	describeError,
	useWidgetRootContext,
	type PostHighlightCardMetric,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { usePopularPost } from './use-popular-post';
import type { PopularPostAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Unlike Latest post, this widget is period-scoped: the host injects the
// dashboard date range through `reportParams`.
type PopularPostRenderAttributes = PopularPostAttributes & Partial< ReportParamsFieldAttributes >;
type PopularPostWidgetProps = WidgetRenderProps< PopularPostRenderAttributes >;

/**
 * Fetches the period's most-viewed post through `usePopularPost` and hands it to
 * the shared `PostHighlightCard`, with loading, error, and empty states handled
 * by `<WidgetState>`.
 *
 * Views are scoped to the dashboard's date range; likes and comments are all-time
 * totals (the Stats post endpoint takes no date range), so those two tiles carry
 * an aggregation note the card surfaces as a tooltip and as visually hidden text.
 *
 * @return The widget content.
 */
function PopularPostReport() {
	const { reportParams } = useWidgetRootContext();
	const { post, isLoading, isFetching, isError, error, refetch } = usePopularPost( reportParams );

	const metrics: PostHighlightCardMetric[] = post
		? [
				{
					key: 'views',
					label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
					value: post.views,
					note: __( 'Views in the selected date range.', 'jetpack-premium-analytics-pkg' ),
				},
				{
					key: 'likes',
					label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
					value: post.likeCount,
					note: __(
						'All-time likes. Stats does not report likes per date range.',
						'jetpack-premium-analytics-pkg'
					),
				},
				{
					key: 'comments',
					label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
					value: post.commentCount,
					note: __(
						'All-time comments. Stats does not report comments per date range.',
						'jetpack-premium-analytics-pkg'
					),
				},
		  ]
		: [];

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ isError }
			isEmpty={ ! post }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load your most popular post. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: trendingUp,
				description: __( 'No post views in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
		>
			{ post && (
				<PostHighlightCard
					title={ post.title }
					url={ post.url }
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
 * WidgetRoot provides the analytics query client, the chart theme, and the
 * dashboard's `reportParams` that the inner report reads through
 * `useWidgetRootContext()`.
 *
 * @param {PopularPostWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PopularPost( { attributes = {} }: PopularPostWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PopularPostReport />
		</WidgetRoot>
	);
}
