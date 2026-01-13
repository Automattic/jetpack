import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { _n, sprintf } from '@wordpress/i18n';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { ConfirmationConfig } from './confirmation-config';

/**
 * FooterContent component for social post preview modal.
 *
 * @return Footer content element or null if no enabled connections.
 */
export function FooterContent() {
	const { enabledConnections } = useSocialMediaConnections();

	const isPrePublishScreen = useSelect( select => {
		const store = select( editorStore );
		return ! store.isCurrentPostPublished() && store.isPublishSidebarOpened();
	}, [] );

	// If the pre-publish sidebar is opened, show the confirmation config.
	if ( isPrePublishScreen ) {
		return <ConfirmationConfig />;
	}

	return enabledConnections.length ? (
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
		</span>
	) : null;
}
