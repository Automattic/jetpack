import { useDispatch, useSelect } from '@wordpress/data';
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
	const socialPreviewRenderCount = useSelect(
		select => select( socialStore ).getRenderCountFor( 'social-preview' ),
		[]
	);

	useEffect( () => {
		// If the user has never seen the pre-publish confirmation, set the default to false, because we want it to be opt-in.
		if ( preferences.data.prePublishConfirmation === undefined ) {
			preferences.set( 'prePublishConfirmation', false );
		}
	}, [ preferences ] );

	// We want to show the preview only
	const showPreview =
		// if social preview hasn't been shown yet,
		socialPreviewRenderCount === 0 &&
		// if auto-share is enabled for the post,
		isPublicizeEnabled &&
		// there are connections,
		hasConnections &&
		// and the user has opted-in to pre-publish confirmation.
		preferences.data.prePublishConfirmation !== false;

	useEffect( () => {
		if ( showPreview ) {
			openUnifiedModal();
		}
	}, [ showPreview, openUnifiedModal ] );

	return null;
}
