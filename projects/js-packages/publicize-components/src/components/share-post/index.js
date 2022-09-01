import {
	usePublicizeConfig,
	useSocialMediaConnections,
	useSharePost,
} from '@automattic/jetpack-publicize-components';
import { Button, PanelRow } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Removes the current message from resharing a post.
 */
function cleanNotice() {
	dispatch( noticesStore ).removeNotice( 'publicize-post-share-message' );
}

/**
 * Sets the notice to the given error message.
 *
 * @param {string} message - The error message to be displayed.
 */
function showErrorNotice( message = __( 'Unable to share the Post', 'jetpack' ) ) {
	const { createErrorNotice } = dispatch( noticesStore );
	createErrorNotice( message, {
		id: 'publicize-post-share-message',
	} );
}

/**
 * Shows the successful message in a snackbar.
 */
function showSuccessNotice() {
	const { createSuccessNotice } = dispatch( noticesStore );
	createSuccessNotice( __( 'Post shared', 'jetpack' ), {
		id: 'publicize-post-share-message',
		type: 'snackbar',
	} );
}

/**
 * Component to trigger the resharing of the post.
 *
 * @returns {object} A button component that will share the current post when clicked.
 */
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

	const sharePost = useCallback( () => {
		if ( ! isPostPublished ) {
			return showErrorNotice(
				__( 'You must publish your post before you can share it.', 'jetpack' )
			);
		}

		cleanNotice( 'publicize-post-share-message' );
		doPublicize();
	}, [ doPublicize, isPostPublished ] );

	return (
		<Button
			variant="secondary"
			onClick={ sharePost }
			disabled={ isButtonDisabled }
			isBusy={ isFetching }
		>
			{ __( 'Share post', 'jetpack' ) }
		</Button>
	);
}

/**
 * A panel row that renders the share button when the resharing
 * feature is available.
 *
 * @returns {object|null} A PanelRow component, or null if nothing should be rendered.
 */
export function SharePostRow() {
	const { isRePublicizeUpgradableViaUpsell } = usePublicizeConfig();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

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
