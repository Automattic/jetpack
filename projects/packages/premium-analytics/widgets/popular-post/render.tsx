/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import {
	PostHighlightCard,
	type PostHighlightCardMetric,
	PostHighlightCardSkeleton,
	type ReportParamsFieldAttributes,
	WidgetRoot,
	WidgetState,
	describeError,
	useWidgetRootContext,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
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
 * The dashboard's date range picks which post is shown; all three tiles are
 * all-time totals from the Stats post endpoint, so they share one window and
 * need no per-tile aggregation note — the same treatment as `Latest post`,
 * which shares this card.
 */
function PopularPostReport() {
	const { reportParams } = useWidgetRootContext();
	const { post, isLoading, isFetching, isError, error, refetch } = usePopularPost( reportParams );
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
			renderLoading={ <PostHighlightCardSkeleton /> }
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

export default function PopularPost( { attributes = {} }: PopularPostWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PopularPostReport />
		</WidgetRoot>
	);
}
