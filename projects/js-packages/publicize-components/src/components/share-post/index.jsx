import {
	useAnalytics,
	isSimpleSite,
	isAtomicSite,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelRow } from '@wordpress/components';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useIsSharingPossible } from '../../hooks/use-is-sharing-possible';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSharePost from '../../hooks/use-share-post';
import { store as socialStore } from '../../social-store';
import { getSocialScriptData } from '../../utils/script-data';

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
function showErrorNotice(
	message = __( 'Unable to share the Post', 'jetpack-publicize-components' )
) {
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
	createSuccessNotice( __( 'Request submitted successfully.', 'jetpack-publicize-components' ), {
		id: 'publicize-post-share-message',
		type: 'snackbar',
	} );
}

/**
 * Get the site type from environment
 *
 * @return {(string)} Site type
 */
function getSiteType() {
	if ( isAtomicSite() ) {
		return 'atomic';
	}

	if ( isSimpleSite() ) {
		return 'simple';
	}

	return 'jetpack';
}

/**
 * Component to trigger the resharing of the post.
 *
 * @return {object} A button component that will share the current post when clicked.
 */
export function SharePostButton() {
	const { isPublicizeEnabled } = usePublicizeConfig();
	const { isFetching, isError, isSuccess, doPublicize } = useSharePost();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const { feature_flags } = getSocialScriptData();
	const { pollForPostShareStatus } = useDispatch( socialStore );
	const { recordEvent } = useAnalytics();

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

	const isSharingPossible = useIsSharingPossible();

	/*
	 * Disabled button when
	 * - sharing is disabled
	 * - no enabled connections
	 * - post is not published
	 * - is sharing post
	 */
	const isButtonDisabled =
		! isPublicizeEnabled || ! isSharingPossible || ! isPostPublished || isFetching;

	const sharePost = useCallback( async () => {
		if ( ! isPostPublished ) {
			return showErrorNotice(
				__( 'You must publish your post before you can share it.', 'jetpack-publicize-components' )
			);
		}

		cleanNotice( 'publicize-post-share-message' );

		recordEvent( 'jetpack_social_reshare_clicked', {
			location: 'editor',
			environment: getSiteType(),
		} );

		await doPublicize();

		if ( feature_flags.useShareStatus ) {
			pollForPostShareStatus();
		}
	}, [
		isPostPublished,
		recordEvent,
		doPublicize,
		feature_flags.useShareStatus,
		pollForPostShareStatus,
	] );

	return (
		<Button
			variant="secondary"
			onClick={ sharePost }
			disabled={ isButtonDisabled }
			isBusy={ isFetching }
		>
			{ __( 'Share post', 'jetpack-publicize-components' ) }
		</Button>
	);
}

/**
 * A panel row that renders the share button when the resharing
 * feature is available.
 *
 * @return {object|null} A PanelRow component, or null if nothing should be rendered.
 */
export function SharePostRow() {
	const { isRePublicizeUpgradableViaUpsell } = usePublicizeConfig();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const { hasConnections } = useSelect( select => select( socialStore ), [] );

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

	// Do not render the button when there are no connections.
	if ( ! hasConnections() ) {
		return null;
	}

	return (
		<PanelRow>
			<SharePostButton />
		</PanelRow>
	);
}
