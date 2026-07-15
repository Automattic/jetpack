/**
 * External dependencies
 */
import { useStatsPostLikes } from '@jetpack-premium-analytics/data';
import { formatRelativeSince } from '@jetpack-premium-analytics/datetime';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	SubscriberList,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
	type SubscriberListItem,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { PostLikesAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostLikesRenderAttributes = PostLikesAttributes & Partial< ReportParamsFieldAttributes >;
type PostLikesWidgetProps = WidgetRenderProps< PostLikesRenderAttributes >;

/**
 * How many likers to list; the endpoint's `found` total feeds the "N more"
 * footer beyond these.
 */
const LIKES_SHOWN = 10;

/**
 * Latest likes inner component. Reads the post scope from WidgetRoot's report
 * params and lists the post's likers through `SubscriberList` — avatar, name
 * (linked to the liker's Reader profile), and the like's relative time, most
 * recent first, with an "N more" footer. The list is a lifetime roster and
 * ignores the dashboard date range.
 *
 * @return The rendered widget content.
 */
function PostLikesInner() {
	const { reportParams } = useWidgetRootContext();
	const parsedPostId = Number( reportParams.post_id );
	const postId = Number.isInteger( parsedPostId ) && parsedPostId > 0 ? parsedPostId : 0;

	const { data, isLoading, isFetching, isError, refetch } = useStatsPostLikes( {
		postId,
		number: LIKES_SHOWN,
	} );

	const items = useMemo< SubscriberListItem[] >(
		() =>
			( data?.likes ?? [] ).map( like => ( {
				id: like.ID,
				name: like.name || like.login,
				avatarUrl: like.avatar_URL,
				// Likers link to their WordPress.com Reader profile, mirroring
				// Calypso's post-likes block (getUserProfileUrl).
				href: like.login ? `https://wordpress.com/reader/users/${ like.login }` : undefined,
				secondaryText: formatRelativeSince( like.date_liked ),
			} ) ),
		[ data ]
	);

	const found = data?.found ?? 0;
	const isEmpty = postId <= 0 || ( !! data && items.length === 0 );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading && ! data }
				isFetching={ isFetching }
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the likes visible; only surface the error
				// when there is nothing to show.
				isError={ ! data && isError }
				isEmpty={ isEmpty }
				error={ {
					description: __(
						"We couldn't load these likes. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description:
						postId <= 0
							? __(
									'Open a post or page report to see its likes here.',
									'jetpack-premium-analytics'
							  )
							: __( 'There are no likes yet.', 'jetpack-premium-analytics' ),
				} }
			>
				<SubscriberList items={ items } moreCount={ Math.max( 0, found - items.length ) } />
			</WidgetState>
		</div>
	);
}

/**
 * Latest likes widget: the scoped post's likers as an avatar roster — the
 * post detail Traffic view's likes card.
 *
 * @param {PostLikesWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PostLikes( { attributes = {} }: PostLikesWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostLikesInner />
		</WidgetRoot>
	);
}
