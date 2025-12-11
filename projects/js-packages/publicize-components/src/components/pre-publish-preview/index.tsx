import { useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { useJetpackSocialSettings } from '../../hooks/use-user-jetpack-social-settings';
import { store as socialStore } from '../../social-store';

/**
 * PrePublishPreview component to conditionally show preview before publishing.
 *
 * @return null
 */
export function PrePublishPreview() {
	const { settings } = useJetpackSocialSettings();
	const { isPublicizeEnabled } = usePublicizeConfig();
	const { openUnifiedModal } = useDispatch( socialStore );
	const { hasConnections } = useSocialMediaConnections();

	// We want to show the preview only
	const showPreview =
		// if auto-share is enabled for the post,
		isPublicizeEnabled &&
		// there are connections,
		hasConnections &&
		// and the user hasn't opted out of the pre-publish confirmation.
		settings.pre_publish_confirmation === 'show';

	useEffect( () => {
		if ( showPreview ) {
			openUnifiedModal();
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps -- We want to run this only once on mount.
	}, [] );

	return null;
}
