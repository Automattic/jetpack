import { useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { comment } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { COMMENT_LIKES_ANCHOR } from '../anchors';
import { AutoSaveFields } from '../components/auto-save-fields';
import { ToggleEdit } from '../components/controls';
import { PlacementSummary } from '../components/placement-summary';
import { BoxRow, SectionBox } from '../components/section-box';
import { onOffBadge } from '../components/status-badge';
import { useSettings, useStatus } from '../data/queries';
import { configures, type Settings } from '../types';
import { sitewideLikesField } from './like-buttons-section';
import type { Field } from '@wordpress/dataviews';
import type { JSX } from 'react';

/**
 * The Comment Likes switch.
 *
 * @return Field.
 */
function commentLikesField(): Field< Settings > {
	return {
		id: 'comment_likes_enabled',
		label: __( 'Allow readers to like individual comments', 'jetpack-sharing-likes' ),
		type: 'boolean',
		Edit: ToggleEdit,
	};
}

/**
 * Comment Likes. No variants: comments have no block to move to.
 *
 * @return Section, or null before status is known.
 */
export function CommentLikesSection(): JSX.Element | null {
	const status = useStatus();
	const settings = useSettings();
	const follows = status?.comment_likes.follows_likes_settings ?? false;
	// The Like buttons section carries the default whenever it configures (`Comment_Likes_Section::render_fields()`).
	const carriesDefault = !! status && follows && ! configures( status.likes.state );
	const fields = useMemo(
		() => [
			commentLikesField(),
			...( carriesDefault
				? [ sitewideLikesField( __( 'Comment Likes are', 'jetpack-sharing-likes' ) ) ]
				: [] ),
		],
		[ carriesDefault ]
	);

	if ( ! status ) {
		return null;
	}

	const title = _x( 'Comment Likes', 'Settings header', 'jetpack-sharing-likes' );

	if ( ! status.comment_likes.supported ) {
		return (
			<SectionBox
				id={ COMMENT_LIKES_ANCHOR }
				icon={ comment }
				title={ title }
				badge={ onOffBadge( false ) }
			>
				<BoxRow>
					<Text render={ <p /> }>
						{ __(
							'Comment Likes need a connection to WordPress.com, which is unavailable while your site is in offline mode.',
							'jetpack-sharing-likes'
						) }
					</Text>
				</BoxRow>
			</SectionBox>
		);
	}

	return (
		<SectionBox
			id={ COMMENT_LIKES_ANCHOR }
			icon={ comment }
			title={ title }
			badge={ onOffBadge( !! settings?.comment_likes_enabled ) }
		>
			{ follows && <PlacementSummary feature="comment-likes" /> }
			<AutoSaveFields fields={ fields } />
		</SectionBox>
	);
}
