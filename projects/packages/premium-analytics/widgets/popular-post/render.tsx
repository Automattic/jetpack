/**
 * External dependencies
 */
import {
	PostHighlightCard,
	type PostHighlightCardMetric,
	PostHighlightCardSkeleton,
	type ReportParamsFieldAttributes,
	WidgetRoot,
	WidgetState,
	describeError,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { usePopularPost } from './use-popular-post';
import type { PopularPostAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The card reports on its own pinned window and reads nothing from the host's
// `reportParams`, but the host still injects them and `WidgetRoot` still takes
// them, so the render type keeps composing the field.
type PopularPostRenderAttributes = PopularPostAttributes & Partial< ReportParamsFieldAttributes >;
type PopularPostWidgetProps = WidgetRenderProps< PopularPostRenderAttributes >;

/**
 * The last 12 months pick which post is shown, but all three tiles are all-time
 * totals, so none carries a per-tile aggregation note.
 */
function PopularPostReport() {
	const { post, range, isLoading, isFetching, isError, error, refetch } = usePopularPost();
	/*
	 * The detail page opens on the window the card ranked over, so the post's own
	 * page measures the year the card's title names. The dashboard's range is
	 * deliberately not carried through: the Insights filter picks a calendar year,
	 * which would scope the detail page to a period this card never reported on.
	 *
	 * Hence not `useWidgetNavigationSearch()`, which exists to carry the host's
	 * window: a widget cannot hand it one of its own. The trade-off is the round
	 * trip — the detail breadcrumb carries this window back, and a year surface
	 * such as Insights resolves a rolling preset to all time, so returning that
	 * way does not restore the year the reader left. The old link was lossy the
	 * same way in reverse, and no param carries the origin window today.
	 */

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
				description: __( 'No post views in the last 12 months.', 'jetpack-premium-analytics-pkg' ),
			} }
			renderLoading={ <PostHighlightCardSkeleton /> }
		>
			{ post && (
				<PostHighlightCard
					title={ post.title }
					url={ post.url }
					postId={ post.id }
					detailSearch={ range }
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
