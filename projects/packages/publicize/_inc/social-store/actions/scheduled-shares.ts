import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { ScheduledShare } from '../types';
import { SET_IS_SCHEDULING_SHARES } from './constants';

const SCHEDULE_SHARE_NOTICE_ID = 'social-scheduled-share';

/**
 * Creates a new scheduled share.
 *
 * @param data - The data.
 *
 * @return A thunk.
 */
export function createScheduledShare(
	data: Pick< ScheduledShare, 'post_id' | 'connection_id' | 'timestamp' > &
		Partial< Pick< ScheduledShare, 'message' > >
) {
	return async function ( { registry } ): Promise< boolean > {
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const { getLastEntitySaveError } = registry.select( coreStore );
		const { createErrorNotice } = registry.dispatch( noticesStore );
		const success = await saveEntityRecord( 'wpcom/v2', 'publicize/scheduled-actions', data );
		// If the creation was not successful, show an error notice.
		if ( ! success ) {
			const lastError = getLastEntitySaveError( 'wpcom/v2', 'publicize/scheduled-actions' );
			let message: string = __(
				'There was an error scheduling the post.',
				'jetpack-publicize-pkg'
			);
			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}
			createErrorNotice( message, {
				type: 'snackbar',
				id: SCHEDULE_SHARE_NOTICE_ID,
			} );
		}

		return success;
	};
}

/**
 * Deletes a scheduled share.
 *
 * @param id - The ID of the scheduled share to delete.
 *
 * @return A thunk.
 */
export function deleteScheduledShare( id: number ) {
	return async function ( { registry } ) {
		const { deleteEntityRecord } = registry.dispatch( coreStore );
		const { getLastEntityDeleteError } = registry.select( coreStore );
		const { createErrorNotice } = registry.dispatch( noticesStore );

		const success = await deleteEntityRecord( 'wpcom/v2', 'publicize/scheduled-actions', id );

		// If the deletion was not successful, show an error notice.
		if ( ! success ) {
			const lastError = getLastEntityDeleteError( 'wpcom/v2', 'publicize/scheduled-actions', id );

			let message: string = __( 'There was an error deleting the item.', 'jetpack-publicize-pkg' );

			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}

			createErrorNotice( message, {
				type: 'snackbar',
			} );
		}
	};
}

/**
 * Sets whether the current post is having scheduled shares created.
 *
 * @param isScheduling - Scheduling status.
 *
 * @return - An action object.
 */
export function setIsSchedulingShares( isScheduling: boolean ) {
	return {
		type: SET_IS_SCHEDULING_SHARES,
		isScheduling,
	};
}

type ScheduledSharesParams = {
	message: string;
	connectionIds: Array< number >;
	timestamp: number;
};
type ScheduledSharesConfig = {
	savePost?: boolean;
	/**
	 * Optional array of actions to include in the success notice.
	 */
	actions?: Array< {
		label: string;
		onClick?: VoidFunction;
	} >;
};

/**
 * Creates scheduled shares for the current post.
 *
 * @param {ScheduledSharesParams} params - The params.
 * @param {ScheduledSharesConfig} config - The share configuration.
 * @return A thunk.
 */
export function scheduleShares(
	{ message, connectionIds, timestamp }: ScheduledSharesParams,
	{ savePost = true, actions = [] }: ScheduledSharesConfig
) {
	return async function ( { dispatch, registry } ): Promise< boolean > {
		if ( ! connectionIds.length || ! timestamp ) {
			return false;
		}

		const { isCurrentPostPublished, isEditedPostDirty, isEditedPostAutosaveable } =
			registry.select( editorStore );

		const { createErrorNotice, createSuccessNotice } = registry.dispatch( noticesStore );

		if ( ! isCurrentPostPublished() ) {
			createErrorNotice(
				__( 'You must publish your post before you can schedule it.', 'jetpack-publicize-pkg' ),
				{
					id: SCHEDULE_SHARE_NOTICE_ID,
				}
			);

			return false;
		}

		dispatch( setIsSchedulingShares( true ) );

		if ( isEditedPostDirty() && isEditedPostAutosaveable() && savePost ) {
			await registry.dispatch( editorStore ).savePost();
		}

		const post_id = registry.select( editorStore ).getCurrentPostId();

		const result = await Promise.all(
			connectionIds.map( connection_id => {
				return dispatch(
					createScheduledShare( {
						post_id,
						connection_id,
						message,
						timestamp,
					} )
				);
			} )
		);

		const success = result.every( Boolean );

		if ( success ) {
			createSuccessNotice( __( 'Post scheduled successfully.', 'jetpack-publicize-pkg' ), {
				type: 'snackbar',
				id: SCHEDULE_SHARE_NOTICE_ID,
				actions,
			} );
		}

		dispatch( setIsSchedulingShares( false ) );

		return success;
	};
}
