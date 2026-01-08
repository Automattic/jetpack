/**
 * Internal dependencies
 */
import { updateMenuCounterOptimistically } from '../utils';
import type { QueryParams } from './types.tsx';
import type { FormResponse } from '../../../types/index.ts';

/**
 * Type for the result of processStatusChange.
 */
type StatusChangeResult = {
	itemsUpdated: { id: number }[];
	itemsFailed: number[];
	numberOfErrors: number;
};

type ProcessStatusChangeParams = {
	items: FormResponse[];
	newStatus: string;
	apiCall: ( id: number ) => Promise< unknown >;
	editEntityRecord: (
		kind: string,
		name: string,
		recordId: number,
		updates: Record< string, unknown >
	) => void;
	updateCountsOptimistically: (
		oldStatus: string,
		newStatus: string,
		count: number,
		queryParams: QueryParams
	) => void;
	queryParams: QueryParams;
};

/**
 * Helper function to process status changes with optimistic updates and error handling.
 * Optimistic Update Strategy:
 * 1. Immediately update local state and counts
 * 2. Make API call
 * 3. On success: invalidate cache to sync with server
 * 4. On failure: rollback local changes
 * 5. Undo actions must preserve original status for proper restoration
 *
 * @param {object}         params                            - The parameters for the status change.
 * @param {FormResponse[]} params.items                      - The items to update.
 * @param {string}         params.newStatus                  - The new status to set.
 * @param {Function}       params.apiCall                    - The API call function (saveEntityRecord or deleteEntityRecord).
 * @param {Function}       params.editEntityRecord           - The editEntityRecord dispatch function.
 * @param {Function}       params.updateCountsOptimistically - The updateCountsOptimistically dispatch function.
 * @param {QueryParams}    params.queryParams                - The query params for count updates.
 * @return {Promise<StatusChangeResult>} The result of the status change operation.
 */
export const processStatusChange = async ( {
	items,
	newStatus,
	apiCall,
	editEntityRecord,
	updateCountsOptimistically,
	queryParams,
}: ProcessStatusChangeParams ): Promise< StatusChangeResult > => {
	// Store original statuses before making optimistic changes
	const originalStatuses = items.map( item => item.status );

	// Make optimistic updates
	items.forEach( item => {
		editEntityRecord( 'postType', 'feedback', item.id, {
			status: newStatus,
		} );

		// Update counts optimistically
		updateCountsOptimistically( item.status, newStatus, 1, queryParams );

		// Update unread counts optimistically in the sidebar only since they do not
		if (
			item.is_unread &&
			( newStatus === 'spam' || newStatus === 'trash' ) &&
			item.status === 'publish'
		) {
			updateMenuCounterOptimistically( -1 );
		}

		if (
			item.is_unread &&
			( item.status === 'spam' || item.status === 'trash' ) &&
			newStatus === 'publish'
		) {
			updateMenuCounterOptimistically( 1 );
		}
	} );

	// Call API with timeout
	const promises = await Promise.allSettled(
		items.map( ( { id } ) => apiCall( id ) as Promise< { id: number } > )
	);

	// Check for both rejected promises and fulfilled promises with undefined/invalid results
	const itemsUpdated: { id: number }[] = [];
	const itemsFailed: number[] = [];

	promises.forEach( ( promise, index ) => {
		// Failed if rejected OR if fulfilled but result is invalid
		if ( promise.status === 'rejected' || ! promise.value?.id ) {
			itemsFailed.push( index );
		} else {
			itemsUpdated.push( promise.value );
		}
	} );

	// Revert optimistic changes for failed items
	itemsFailed.forEach( index => {
		const item = items[ index ];
		const originalStatus = originalStatuses[ index ];

		editEntityRecord( 'postType', 'feedback', item.id, {
			status: originalStatus,
		} );

		// Revert the count change
		updateCountsOptimistically( newStatus, originalStatus, 1, queryParams );

		// Revert the menu counter change
		if (
			item.is_unread &&
			( newStatus === 'spam' || newStatus === 'trash' ) &&
			originalStatus === 'publish'
		) {
			updateMenuCounterOptimistically( 1 ); // Revert the decrement
		}

		if (
			item.is_unread &&
			( originalStatus === 'spam' || originalStatus === 'trash' ) &&
			newStatus === 'publish'
		) {
			updateMenuCounterOptimistically( -1 ); // Revert the increment
		}
	} );

	return {
		itemsUpdated,
		itemsFailed,
		numberOfErrors: itemsFailed.length,
	};
};
