import { siteHasFeature } from '@automattic/jetpack-script-data';
import {
	useAnalytics,
	isSimpleSite,
	isAtomicSite,
} from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useIsReSharingPossible } from '../../hooks/use-is-resharing-possible';
import useSharePost from '../../hooks/use-share-post';
import { store as socialStore } from '../../social-store';
import { features } from '../../utils/constants';

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
 * @param {object}   props                    - The component props.
 * @param {Function} props.onShareCompleted   - The callback to be called when the share is completed.
 * @param {boolean}  [props.isDisabled=false] - Whether the button is disabled or not.
 * @return {object} A button component that will share the current post when clicked.
 */
export function SharePostButton( { onShareCompleted, isDisabled = false } ) {
	const hasMediaFeatures =
		siteHasFeature( features.IMAGE_GENERATOR ) || siteHasFeature( features.ENHANCED_PUBLISHING );
	const { isFetching, isError, isSuccess, doPublicize } = useSharePost();
	const { isAutosaveablePost, isDirtyPost, isPostPublished, isSavingPost } = useSelect( select => {
		const editorSelector = select( editorStore );

		return {
			isAutosaveablePost: editorSelector.isEditedPostAutosaveable(),
			isDirtyPost: editorSelector.isEditedPostDirty(),
			isPostPublished: editorSelector.isCurrentPostPublished(),
			isSavingPost: editorSelector.isSavingPost(),
		};
	}, [] );
	const { pollForPostShareStatus } = useDispatch( socialStore );
	const { recordEvent } = useAnalytics();
	const savePost = dispatch( editorStore ).savePost;

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
		onShareCompleted();
	}, [ isFetching, isError, isSuccess, onShareCompleted ] );

	const isReSharingPossible = useIsReSharingPossible();

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

		/**
		 * The share endpoint only gets the custom message as a parameter, the attached media and
		 * SIG is saved to the post meta and will be read on wpcom. Because of that we need to save
		 * the post before sharing it, if it has the media features to make sure we use the latest data.
		 */
		if ( isDirtyPost && isAutosaveablePost && hasMediaFeatures ) {
			await savePost();
		}

		await doPublicize();

		if ( siteHasFeature( features.SHARE_STATUS ) ) {
			pollForPostShareStatus();
		}
	}, [
		isPostPublished,
		recordEvent,
		isDirtyPost,
		isAutosaveablePost,
		hasMediaFeatures,
		doPublicize,
		savePost,
		pollForPostShareStatus,
	] );

	return (
		<Button
			variant="primary"
			onClick={ sharePost }
			disabled={ ! isReSharingPossible || isDisabled }
			isBusy={ isFetching || isSavingPost }
		>
			{ __( 'Share', 'jetpack-publicize-components' ) }
		</Button>
	);
}
