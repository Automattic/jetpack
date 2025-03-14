import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { ScheduledShare } from '../types';

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
		const { createErrorNotice, createSuccessNotice } = registry.dispatch( noticesStore );
		const success = await saveEntityRecord( 'wpcom/v2', 'publicize/scheduled-actions', data );
		// If the creation was not successful, show an error notice.
		if ( ! success ) {
			const lastError = getLastEntitySaveError( 'wpcom/v2', 'publicize/scheduled-actions' );
			let message = __( 'There was an error scheduling the post.', 'jetpack-publicize-components' );
			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}
			createErrorNotice( message, {
				type: 'snackbar',
				id: 'social-scheduled-share',
			} );
		} else {
			createSuccessNotice( __( 'Post scheduled successfully.', 'jetpack-publicize-components' ), {
				type: 'snackbar',
				id: 'social-scheduled-share',
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

			let message = __( 'There was an error deleting the item.', 'jetpack-publicize-components' );

			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}

			createErrorNotice( message, {
				type: 'snackbar',
			} );
		}
	};
}
