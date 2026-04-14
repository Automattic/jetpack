import apiFetch from '@wordpress/api-fetch';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { isErrorResponse } from '../../utils/share-post';
import { SET_IS_SHARING_CURRENT_POST } from './constants';
import { pollForPostShareStatus } from './share-status';

/**
 * Sets whether the current post is being shared.
 *
 * @param isSharing - Whether the current post is being shared.
 *
 * @return - An action object.
 */
export function setIsSharingCurrentPost( isSharing: boolean ) {
	return {
		type: SET_IS_SHARING_CURRENT_POST,
		isSharing,
	};
}

const SHARE_POST_NOTICE_ID = 'publicize_share_post_notice';

type ShareCurrentPostParams = {
	message: string;
	skipped_connections: Array< string >;
};
type ShareCurrentPostConfig = {
	apiPath: string;
	savePost?: boolean;
};

/**
 * Shares the current post.
 *
 * @param {ShareCurrentPostParams} params - The share options.
 * @param {ShareCurrentPostConfig} config - The share configuration.
 * @return A thunk.
 */
export function shareCurrentPost(
	{ message, skipped_connections }: ShareCurrentPostParams,
	{ apiPath, savePost = true }: ShareCurrentPostConfig
) {
	return async function ( { dispatch, registry } ): Promise< boolean > {
		const { createErrorNotice, removeNotice } = registry.dispatch( noticesStore );
		const { isCurrentPostPublished, isEditedPostDirty, isEditedPostAutosaveable } =
			registry.select( editorStore );

		if ( ! isCurrentPostPublished() ) {
			createErrorNotice(
				__( 'You must publish your post before you can share it.', 'jetpack-publicize-pkg' ),
				{
					id: SHARE_POST_NOTICE_ID,
				}
			);

			return false;
		}

		dispatch( setIsSharingCurrentPost( true ) );

		removeNotice( SHARE_POST_NOTICE_ID );

		if ( isEditedPostDirty() && isEditedPostAutosaveable() && savePost ) {
			await registry.dispatch( editorStore ).savePost();
		}

		let success: boolean;
		let error: string = __( 'There was an error sharing the post.', 'jetpack-publicize-pkg' );

		try {
			const currentPostId = registry.select( editorStore ).getCurrentPostId();

			const path = apiPath.replace( '{postId}', currentPostId.toString() );
			const response = await apiFetch( {
				path,
				method: 'POST',
				data: {
					message,
					skipped_connections,
					async: true,
				},
			} );

			success = ! isErrorResponse( response );
		} catch ( e ) {
			if ( e && typeof e === 'object' && 'message' in e ) {
				error += ' ' + e.message;
			}

			success = false;
		}

		if ( ! success ) {
			createErrorNotice( error, {
				type: 'snackbar',
				id: SHARE_POST_NOTICE_ID,
			} );
		} else {
			dispatch( pollForPostShareStatus() );
		}

		dispatch( setIsSharingCurrentPost( false ) );

		return success;
	};
}
