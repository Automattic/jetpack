import { Button, useNavigator } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { store as socialStore } from '../../../social-store';
import { SHARING_ACTIVITY_TABS } from '../../../utils';
import { ConfirmationConfig } from './confirmation-config';

/**
 * ScheduledPostsNav component to navigate to scheduled posts in sharing activity.
 *
 * @return Button element or null.
 */
function ScheduledPostsNav() {
	const navigator = useNavigator();
	const { setUnifiedModalData, setUnifiedModalScreenLock } = useDispatch( socialStore );

	const hasScheduledShares = useSelect( select => {
		const postId = select( editorStore ).getCurrentPostId();

		return postId && select( socialStore ).getScheduledSharesForPost( Number( postId ) ).length > 0;
	}, [] );

	const viewScheduled = useCallback( () => {
		setUnifiedModalScreenLock( false );
		setUnifiedModalData( { sharingActivity: { initialTab: SHARING_ACTIVITY_TABS.SCHEDULED } } );
		navigator.goTo( '/sharing-activity' );
	}, [ navigator, setUnifiedModalData, setUnifiedModalScreenLock ] );

	return hasScheduledShares ? (
		<Button variant="link" onClick={ viewScheduled }>
			{ __( 'View scheduled', 'jetpack-publicize-pkg' ) }
		</Button>
	) : null;
}

/**
 * FooterInfo component for social post preview modal.
 *
 * @return Footer info element.
 */
function FooterInfo() {
	const { enabledConnections } = useSocialMediaConnections();
	const isCurrentPostPublished = useSelect(
		select => select( editorStore ).isCurrentPostPublished(),
		[]
	);

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
			{ isCurrentPostPublished ? <ScheduledPostsNav /> : null }
		</>
	);
}

/**
 * FooterContent component for social post preview modal.
 *
 * @return Footer content element.
 */
export function FooterContent() {
	const isPrePublishScreen = useSelect( select => {
		const store = select( editorStore );
		return ! store.isCurrentPostPublished() && store.isPublishSidebarOpened();
	}, [] );

	// If the pre-publish sidebar is opened, show the confirmation config.
	if ( isPrePublishScreen ) {
		return <ConfirmationConfig />;
	}

	return <FooterInfo />;
}
