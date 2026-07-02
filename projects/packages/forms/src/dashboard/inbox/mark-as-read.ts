/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { updateMenuCounter, updateMenuCounterOptimistically } from './utils';
import type { DispatchActions } from './stage/types';
import type { FormResponse } from '../../types';

type EditEntityRecord = DispatchActions[ 'editEntityRecord' ];

/**
 * Marks a single feedback response as read, both on the server and in the store,
 * and keeps the admin-menu unread counter in sync: it optimistically decrements
 * the sidebar badge, then reconciles with the authoritative server count, and
 * reverts both the store edit and the badge if the request fails.
 *
 * This is shared by the inbox inspectors (via `useMarkAsReadOnView`) and the
 * "Mark as read" row/bulk actions so the behaviour cannot drift between the
 * wp-build and legacy dashboards — the divergence that previously left the
 * sidebar badge stale until a page refresh.
 *
 * @param response         - The response to mark as read.
 * @param editEntityRecord - The core-data `editEntityRecord` dispatcher.
 * @param onSuccess        - Optional callback run after the server confirms the read.
 * @return A promise that resolves once the read has been persisted (or reverted).
 */
export function markResponseAsRead(
	response: Pick< FormResponse, 'id' | 'status' >,
	editEntityRecord: EditEntityRecord,
	onSuccess?: ( responseId: number ) => void
): Promise< void > {
	const { id, status } = response;

	// Immediately update the entity in the store.
	editEntityRecord( 'postType', 'feedback', id, { is_unread: false } );

	// Optimistically decrement the sidebar unread counter so it updates without
	// waiting for the server (inbox/published responses only).
	if ( status === 'publish' ) {
		updateMenuCounterOptimistically( -1 );
	}

	return apiFetch< { count: number } >( {
		path: `/wp/v2/feedback/${ id }/read`,
		method: 'POST',
		data: { is_unread: false },
	} )
		.then( ( { count } ) => {
			// Sync the sidebar counter with the authoritative server count.
			updateMenuCounter( count );
			onSuccess?.( id );
		} )
		.catch( () => {
			// Revert the store edit on failure.
			editEntityRecord( 'postType', 'feedback', id, { is_unread: true } );

			// Revert the optimistic sidebar decrement.
			if ( status === 'publish' ) {
				updateMenuCounterOptimistically( 1 );
			}
		} );
}
