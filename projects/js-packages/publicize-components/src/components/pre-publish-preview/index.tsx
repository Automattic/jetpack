import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import { useJetpackSocialPreferences } from '../../hooks/use-jetpack-social-preferences';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
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
	const { showPrePublishConfirmation } = useJetpackSocialPreferences();
	const socialPreviewRenderCount = useSelect( select =>
		select( socialStore ).getRenderCountFor( 'social-preview' )
	);

	// We want to show the preview only
	const showPreview =
		// if social preview hasn't been shown yet,
		socialPreviewRenderCount === 0 &&
		// if auto-share is enabled for the post,
		isPublicizeEnabled &&
		// there are connections,
		hasConnections &&
		// and the user hasn't opted out of the pre-publish confirmation.
		showPrePublishConfirmation;

	useEffect( () => {
		if ( showPreview ) {
			openUnifiedModal();
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps -- We want to run this only once on mount.
	}, [] );

	return null;
}
