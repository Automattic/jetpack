import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Button } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { check, copy, Icon } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import AddToContentMenu from '../add-to-content-menu';
import { linkForVideo } from './video-info-card';
import './live-celebration.scss';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: LibraryItem;
	onDismiss: () => void;
};

/**
 * One-time celebration in the player slot: shown the first time an upload
 * session's video becomes playable, which is the moment it is genuinely live.
 * Carries the share link and the post/page hand-off — the two things worth
 * doing with a video that just went live — and "Watch video" hands the slot
 * back to the normal player. Purely presentational: the caller decides when
 * it shows and records the first publish.
 *
 * Copying uses `useCopyToClipboard` (clipboard.js) rather than
 * `navigator.clipboard` because the latter is secure-context-only and the dev
 * environments here run on plain HTTP — same reasoning as VideoInfoCard's
 * copy buttons.
 *
 * @param props           - Component props.
 * @param props.video     - The now-live video record.
 * @param props.onDismiss - Swaps the slot to the normal player.
 * @return The celebration element.
 */
export default function LiveCelebration( { video, onDismiss }: Props ): ReactElement {
	const link = linkForVideo( video );
	const { createSuccessNotice } = useGlobalNotices();
	const copyRef = useCopyToClipboard( link, () =>
		createSuccessNotice( __( 'Link copied to clipboard.', 'jetpack-videopress-pkg' ) )
	);

	return (
		<div className="vp-video-details__player vp-live-celebration">
			<Stack direction="column" gap="md" align="center">
				<span className="vp-live-celebration__icon">
					<Icon icon={ check } size={ 32 } />
				</span>
				<Text variant="body-lg" render={ <h3 /> } className="vp-live-celebration__title">
					{ __( 'Your video is live', 'jetpack-videopress-pkg' ) }
				</Text>
				<Text variant="body-sm" render={ <span /> } className="vp-live-celebration__url">
					{ link }
				</Text>
				<div className="vp-live-celebration__actions">
					<Button variant="secondary" size="compact" icon={ copy } ref={ copyRef }>
						{ __( 'Copy link', 'jetpack-videopress-pkg' ) }
					</Button>
					<AddToContentMenu guid={ video.guid } size="compact" />
					<Button variant="primary" size="compact" onClick={ onDismiss }>
						{ __( 'Watch video', 'jetpack-videopress-pkg' ) }
					</Button>
				</div>
			</Stack>
		</div>
	);
}
