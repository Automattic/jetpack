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
 * The last 12 months pick which post is shown; all three tiles are all-time
 * totals from the Stats post endpoint, so they share one window.
 *
 * The tiles carry no caveat saying so, which is deliberate: the old Stats card
 * this replaces put the same lifetime totals under the same period-naming
 * heading with nothing on the tiles either, and the widget header's help note
 * spells the aggregation out. Adding one is a design decision, not a defect fix.
 */
function PopularPostReport() {
	const { post, range, isLoading, isFetching, isError, error, refetch } = usePopularPost();

	const metrics: PostHighlightCardMetric[] = post
		? [
				{
					key: 'views',
					label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
					value: post.views,
				},
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
			{ /* The detail page opens on the window the card ranked over, so the post's own
			     page measures the period the card's title names. The dashboard's range is
			     deliberately not carried through: the Insights filter picks a calendar year,
			     which would scope the detail page to a period this card never reported on.

			     Hence not `useWidgetNavigationSearch()`, which exists to carry the host's
			     window: a widget cannot hand it one of its own. The breadcrumb back does
			     not restore the year the reader left, but it never did — it carries no
			     section either, so it lands on the first one whatever window travels. */ }
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
