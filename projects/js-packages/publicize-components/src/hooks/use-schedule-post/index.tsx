import { siteHasFeature } from '@automattic/jetpack-script-data';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as socialStore } from '../../social-store';
import { features } from '../../utils';
import useSocialMediaMessage from '../use-social-media-message';

type SchedulePostOptions = {
	/** The connection IDs to share to. */
	connectionIds: number[];
	/** The message to share. */
	message?: string;
	/** The timestamp to schedule the share for. */
	timestamp: number;
};

/**
 * Hook to schedule a post for sharing to social media connections.
 *
 * @return {object} Object containing schedule functionality and state.
 */
export function useSchedulePost() {
	const [ isScheduling, setIsScheduling ] = useState( false );

	const { postId, isAutosaveablePost, isDirtyPost } = useSelect( select => {
		const editorSelector = select( editorStore );

		return {
			postId: editorSelector.getCurrentPostId(),
			isAutosaveablePost: editorSelector.isEditedPostAutosaveable(),
			isDirtyPost: editorSelector.isEditedPostDirty(),
		};
	}, [] );

	const { createScheduledShare } = useDispatch( socialStore );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { message } = useSocialMediaMessage();
	const hasMediaFeatures =
		siteHasFeature( features.IMAGE_GENERATOR ) || siteHasFeature( features.ENHANCED_PUBLISHING );

	const savePost = dispatch( editorStore ).savePost;

	const schedulePost = useCallback(
		async ( { connectionIds, timestamp }: SchedulePostOptions ) => {
			if ( ! connectionIds.length || ! timestamp ) {
				return false;
			}

			setIsScheduling( true );

			/**
			 * The share endpoint only gets the custom message as a parameter, the attached media and
			 * SIG is saved to the post meta and will be read on wpcom. Because of that we need to save
			 * the post before sharing it, if it has the media features to make sure we use the latest data.
			 */
			if ( isDirtyPost && isAutosaveablePost && hasMediaFeatures ) {
				await savePost();
			}

			try {
				// Process each connection separately, one at a time
				for ( const connectionId of connectionIds ) {
					await createScheduledShare( {
						post_id: postId,
						connection_id: connectionId,
						message,
						timestamp,
					} );
				}

				createSuccessNotice(
					__( 'Social post scheduled successfully.', 'jetpack-publicize-components' ),
					{ type: 'snackbar' }
				);

				setIsScheduling( false );
				return true;
			} catch {
				createErrorNotice(
					__( 'Failed to schedule social post.', 'jetpack-publicize-components' ),
					{ type: 'snackbar' }
				);

				setIsScheduling( false );
				return false;
			}
		},
		[
			isDirtyPost,
			isAutosaveablePost,
			hasMediaFeatures,
			savePost,
			createSuccessNotice,
			createScheduledShare,
			postId,
			message,
			createErrorNotice,
		]
	);

	return {
		schedulePost,
		isScheduling,
	};
}
