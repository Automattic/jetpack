/**
 * External dependencies
 */
import { useStatsPostComments, toPostId } from '@jetpack-premium-analytics/data';
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
import type { PostCommentsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostCommentsRenderAttributes = PostCommentsAttributes & Partial< ReportParamsFieldAttributes >;
type PostCommentsWidgetProps = WidgetRenderProps< PostCommentsRenderAttributes >;

/** How many comments to list; `found` feeds the "N more" footer. */
const COMMENTS_SHOWN = 10;

/**
 * Lists the scoped post's approved comments, newest first.
 */
function PostCommentsInner() {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	const { data, isLoading, isFetching, isError, refetch } = useStatsPostComments( {
		postId,
		number: COMMENTS_SHOWN,
	} );

	const items = useMemo< SubscriberListItem[] >(
		() =>
			( data?.comments ?? [] ).map( comment => ( {
				id: comment.ID,
				name: comment.name,
				avatarUrl: comment.avatar_URL,
				// Link the name to the exact comment, rather than the author's
				// profile, so the row takes readers to the interaction it represents.
				href: comment.URL,
				secondaryText: formatRelativeSince( comment.date ),
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
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the comments visible; only surface the error
				// when there is nothing to show.
				isError={ ! data && isError }
				isEmpty={ isEmpty }
				error={ {
					description: __(
						"We couldn't load these comments. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description:
						postId <= 0
							? __(
									'Open a post or page report to see its comments here.',
									'jetpack-premium-analytics-pkg'
							  )
							: __( 'There are no comments yet.', 'jetpack-premium-analytics-pkg' ),
				} }
			>
				<SubscriberList items={ items } moreCount={ Math.max( 0, found - items.length ) } />
			</WidgetState>
		</div>
	);
}

export default function PostComments( { attributes = {} }: PostCommentsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostCommentsInner />
		</WidgetRoot>
	);
}
