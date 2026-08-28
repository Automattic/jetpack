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

// The card's title names the last 12 months; the tiles under it are lifetime
// totals. The widget header's help note is what discloses that — this repeats it
// on the tile itself, as a hover tooltip and as text for assistive technology.
const ALL_TIME_NOTE = () =>
	__( 'Total since this post was published.', 'jetpack-premium-analytics-pkg' );

/**
 * The last 12 months pick which post is shown; all three tiles are all-time
 * totals from the Stats post endpoint, so they share one window. They still
 * carry a note, unlike `Latest post`, which shares this card: that card's title
 * names no period, while this one's names a year the tiles do not measure.
 */
function PopularPostReport() {
	const { post, range, isLoading, isFetching, isError, error, refetch } = usePopularPost();

	const metrics: PostHighlightCardMetric[] = post
		? [
				{
					key: 'views',
					label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
					value: post.views,
					note: ALL_TIME_NOTE(),
				},
				{
					key: 'likes',
					label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
					value: post.likeCount,
					note: ALL_TIME_NOTE(),
				},
				{
					key: 'comments',
					label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
					value: post.commentCount,
					note: ALL_TIME_NOTE(),
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
			     window: a widget cannot hand it one of its own. The trade-off is the round
			     trip — a year surface such as Insights resolves a rolling preset to all
			     time, so the detail breadcrumb back does not restore the year the reader
			     left. No param carries the origin window today. */ }
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
