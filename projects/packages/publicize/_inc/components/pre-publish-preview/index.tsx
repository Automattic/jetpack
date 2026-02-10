import { useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { useSocialUserPreferences } from '../../hooks/use-social-user-preferences';
import { store as socialStore } from '../../social-store';

/**
 * PrePublishPreview component to conditionally show preview before publishing.
 *
 * @return null
 */
export function PrePublishPreview() {
	const { isPublicizeEnabled } = usePublicizeConfig();
	const { openUnifiedModal } = useDispatch( socialStore );
	const { hasConnections } = useSocialMediaConnections();
	const preferences = useSocialUserPreferences();

	// We want to show the preview only
	const showPreview =
		// if auto-share is enabled for the post,
		isPublicizeEnabled &&
		// there are connections,
		hasConnections &&
		// and the user has not opted out of pre-publish confirmation.
		preferences.data.showPrePublishConfirmation !== false;

	useEffect( () => {
		if ( showPreview ) {
			openUnifiedModal();
		}
	}, [ showPreview, openUnifiedModal ] );

	return null;
}
