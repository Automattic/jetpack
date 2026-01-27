import { Button, useNavigator } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { store as socialStore } from '../../../social-store';
import { ConfirmationConfig } from './confirmation-config';

/**
 * FooterContent component for social post preview modal.
 *
 * @return Footer content element or null if no enabled connections.
 */
export function FooterContent() {
	const { enabledConnections } = useSocialMediaConnections();
	const navigator = useNavigator();
	const { setUnifiedModalData, setUnifiedModalScreenLock } = useDispatch( socialStore );

	const isPrePublishScreen = useSelect( select => {
		const store = select( editorStore );
		return ! store.isCurrentPostPublished() && store.isPublishSidebarOpened();
	}, [] );

	const hasScheduledShares = useSelect( select => {
		const postId = select( editorStore ).getCurrentPostId();

		return postId && select( socialStore ).getScheduledSharesForPost( Number( postId ) ).length > 0;
	}, [] );

	const viewScheduled = useCallback( () => {
		setUnifiedModalScreenLock( false );
		setUnifiedModalData( { initialTab: 'scheduled' } );
		navigator.goTo( '/sharing-activity' );
	}, [ navigator, setUnifiedModalData, setUnifiedModalScreenLock ] );

	// If the pre-publish sidebar is opened, show the confirmation config.
	if ( isPrePublishScreen ) {
		return <ConfirmationConfig />;
	}

	return (
		<>
			{ enabledConnections.length ? (
				<span>
					{ sprintf(
						/* translators: %d: Number of enabled connections. */
						_n(
							'Ready to share to %d account.',
							'Ready to share to %d accounts.',
							enabledConnections.length,
							'jetpack-publicize-pkg'
						),
						enabledConnections.length
					) }
					&nbsp;
				</span>
			) : null }
			{ hasScheduledShares ? (
				<Button variant="link" onClick={ viewScheduled }>
					{ __( 'View scheduled', 'jetpack-publicize-pkg' ) }
				</Button>
			) : null }
		</>
	);
}
