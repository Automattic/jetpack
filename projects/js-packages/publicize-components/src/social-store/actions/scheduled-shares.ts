import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

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
