import { useSocialMediaConnections } from '@automattic/jetpack-publicize-components';
import { Button, PanelRow } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSharePost from '../../hooks/use-share-post';

function cleanNotice() {
	dispatch( noticesStore ).removeNotice( 'publicize-post-share-message' );
}

function showErrorNotice( message = __( 'Unable to share the Post', 'jetpack' ) ) {
	const { createErrorNotice } = dispatch( noticesStore );
	createErrorNotice( message, {
		id: 'publicize-post-share-message',
	} );
}

function showSuccessNotice() {
	const { createSuccessNotice } = dispatch( noticesStore );
	createSuccessNotice( __( 'Post shared', 'jetpack' ), {
		id: 'publicize-post-share-message',
		type: 'snackbar',
	} );
}

export function SharePostButton() {
	const { hasEnabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled } = usePublicizeConfig();
	const { isFetching, isError, isSuccess, doPublicize } = useSharePost();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	useEffect( () => {
		if ( isFetching ) {
			return;
		}

		if ( isError ) {
			return showErrorNotice();
		}

		if ( ! isSuccess ) {
			return;
		}

		showSuccessNotice();
	}, [ isFetching, isError, isSuccess ] );

	/*
	 * Disabled button when
	 * - sharing is disabled
	 * - no enabled connections
	 * - post is not published
	 * - is sharing post
	 */
	const isButtonDisabled =
		! isPublicizeEnabled || ! hasEnabledConnections || ! isPostPublished || isFetching;

	return (
		<Button
			variant="secondary"
			onClick={ function () {
				if ( ! isPostPublished ) {
					return showErrorNotice(
						__( 'You must publish your post before you can share it.', 'jetpack' )
					);
				}

				cleanNotice( 'publicize-post-share-message' );
				doPublicize();
			} }
			disabled={ isButtonDisabled }
			isBusy={ isFetching }
		>
			{ __( 'Share post', 'jetpack' ) }
		</Button>
	);
}

export function SharePostRow() {
	const { isRePublicizeFeatureEnabled, isRePublicizeUpgradableViaUpsell } = usePublicizeConfig();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	// Do not render when RePublicize feature is not enabled.
	if ( ! isRePublicizeFeatureEnabled ) {
		return null;
	}

	// Do not render the button when the post is not published.
	if ( ! isPostPublished ) {
		return null;
	}

	/*
	 * Do not render when the feature is upgradable.
	 * We show the upsale notice instead.
	 */
	if ( isRePublicizeUpgradableViaUpsell ) {
		return null;
	}

	return (
		<PanelRow>
			<SharePostButton />
		</PanelRow>
	);
}
