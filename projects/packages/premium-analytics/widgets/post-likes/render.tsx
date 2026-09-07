/**
 * External dependencies
 */
import { useStatsPostLikes, toPostId } from '@jetpack-premium-analytics/data';
import { formatRelativeSince } from '@jetpack-premium-analytics/datetime';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	SubscriberList,
	SubscriberListSkeleton,
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
 * Lists the scoped post's likers, most recent first. The list is a lifetime
 * roster and ignores the dashboard date range.
 */
function PostLikesInner() {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

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
				isLoading={ isLoading }
				isFetching={ isFetching }
				// `placeholderData` keeps the prior likes on screen, so a transient
				// refetch failure should not replace them with an error.
				isError={ ! data && isError }
				isEmpty={ isEmpty }
				renderLoading={ <SubscriberListSkeleton rows={ LIKES_SHOWN } /> }
				error={ {
					description: __(
						"We couldn't load these likes. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description:
						postId <= 0
							? __(
									'Open a post or page report to see its likes here.',
									'jetpack-premium-analytics-pkg'
							  )
							: __( 'There are no likes yet.', 'jetpack-premium-analytics-pkg' ),
				} }
			>
				<SubscriberList items={ items } moreCount={ Math.max( 0, found - items.length ) } />
			</WidgetState>
		</div>
	);
}

export default function PostLikes( { attributes = {} }: PostLikesWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostLikesInner />
		</WidgetRoot>
	);
}
