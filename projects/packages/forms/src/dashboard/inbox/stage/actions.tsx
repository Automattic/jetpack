/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { Icon, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { seen, unseen, trash, backup, commentContent } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { notSpam, spam } from '../../icons/index.ts';
import { store as dashboardStore } from '../../store/index.js';
import { updateMenuCounter, updateMenuCounterOptimistically } from '../utils.js';
import { defaultView } from './views.js';
/**
 * Types
 */
import type { Action, DispatchActions, QueryParams, Registry } from './types.tsx';
import type { FormResponse } from '../../../types/index.ts';

/**
 * Helper function to extract count-relevant query params from the current query.
 *
 * @param {object} currentQuery - The current query from the store.
 * @return {object} Query params relevant for count caching.
 */
const getCountQueryParams = ( currentQuery: QueryParams ): QueryParams => {
	const queryParams: QueryParams = {};

	if ( currentQuery?.search ) {
		queryParams.search = currentQuery.search;
	}
	if ( currentQuery?.parent ) {
		queryParams.parent = currentQuery.parent;
	}
	if ( currentQuery?.before ) {
		queryParams.before = currentQuery.before;
	}
	if ( currentQuery?.after ) {
		queryParams.after = currentQuery.after;
	}
	if ( currentQuery?.is_unread !== undefined ) {
		queryParams.is_unread = currentQuery.is_unread;
	}

	return queryParams;
};

const undoingMessage = __( 'Undoing…', 'jetpack-forms' );

// Track pending refetch promises so undo can wait for them to complete
const pendingRefetches = new Map< string, Promise< void > >();

/**
 * Helper function to invalidate cache and navigate to correct page after removing items.
 *
 * @param {object} registry               - WordPress data registry.
 * @param {object} currentQuery           - The current query.
 * @param {object} queryParams            - Query parameters for count caching.
 * @param {string} statusBeingRemovedFrom - The status items are being removed from ('trash', 'spam', or 'inbox').
 */
const invalidateCacheAndNavigate = (
	registry: Registry,
	currentQuery: QueryParams,
	queryParams: QueryParams,
	statusBeingRemovedFrom: string
): void => {
	// Invalidate counts to ensure accurate totals
	registry.dispatch( dashboardStore ).invalidateCounts();

	// Navigate to correct page if current page will be invalid
	const { getTrashCount, getSpamCount, getInboxCount } = registry.select( dashboardStore );
	const { setCurrentQuery } = registry.dispatch( dashboardStore );

	// Determine what status we're currently viewing
	// currentQuery.status may not be in QueryParams type, but it exists at runtime
	const currentStatus = currentQuery?.status || 'draft,publish';
	const isViewingInbox = currentStatus === 'draft,publish';
	const isViewingSpam = currentStatus === 'spam';
	const isViewingTrash = currentStatus === 'trash';

	// Only adjust page if we're viewing the same status that items are being removed from
	const shouldAdjustPage =
		( isViewingTrash && statusBeingRemovedFrom === 'trash' ) ||
		( isViewingSpam && statusBeingRemovedFrom === 'spam' ) ||
		( isViewingInbox && statusBeingRemovedFrom === 'inbox' );

	let targetPage = currentQuery?.page || defaultView.page;

	if ( shouldAdjustPage ) {
		// Get the appropriate count based on which status we're removing from
		const countGetters = {
			trash: getTrashCount,
			spam: getSpamCount,
			inbox: getInboxCount,
		};
		const remainingCount = countGetters[ statusBeingRemovedFrom ]( queryParams );

		const perPage = currentQuery?.per_page || defaultView.perPage;
		const newTotalPages = Math.max( 1, Math.ceil( remainingCount / perPage ) );
		const currentPage = currentQuery?.page || defaultView.page;

		// Determine the target page (either current page or last valid page if current is invalid)
		targetPage = currentPage > newTotalPages ? newTotalPages : currentPage;
	}

	// Update the query to ensure it's current (preserving the current page if we shouldn't adjust)
	const updatedQuery = {
		...currentQuery,
		page: targetPage,
	};

	setCurrentQuery( updatedQuery );
};

// TODO: We should probably have better error messages in case of failure.
const getGenericErrorMessage = ( numberOfErrors: number ): string => {
	return numberOfErrors === 1
		? __( 'An error occurred.', 'jetpack-forms' )
		: sprintf(
				/* translators: %d: the number of responses. */
				_n(
					'An error occurred for %d response.',
					'An error occurred for %d responses.',
					numberOfErrors,
					'jetpack-forms'
				),
				numberOfErrors
		  );
};

/**
 * Wraps a promise with a timeout to ensure it rejects after a reasonable time.
 * This is useful for network requests that might hang when the network is disabled.
 *
 * @param {Promise} promise   - The promise to wrap.
 * @param {number}  timeoutMs - The timeout in milliseconds (default: 30000).
 * @return {Promise} The wrapped promise that will reject on timeout.
 */
const withTimeout = (
	promise: Promise< unknown >,
	timeoutMs: number = 30000
): Promise< unknown > => {
	return Promise.race( [
		promise,
		new Promise( ( _, reject ) =>
			setTimeout( () => reject( new Error( 'Request timeout' ) ), timeoutMs )
		),
	] );
};

/*
 * Waits until the current entity records query resolves (or times out).
 */
const waitForEntityRecordsResolution = async (
	registry: Registry,
	currentQuery: QueryParams
): Promise< void > => {
	if ( ! currentQuery ) {
		return;
	}

	// Clone to avoid accidental mutations while we wait.
	const querySnapshot = { ...currentQuery };

	try {
		await withTimeout(
			registry.resolveSelect( coreStore ).getEntityRecords( 'postType', 'feedback', querySnapshot ),
			10000
		);
	} catch {
		// Ignore failures/timeouts—UI should still recover once data arrives.
	}
};

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
	editEntityRecord: DispatchActions[ 'editEntityRecord' ];
	updateCountsOptimistically: DispatchActions[ 'updateCountsOptimistically' ];
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
 * @param {object}         params                            - The parameters for the status change.
 * @param {FormResponse[]} params.items                      - The items to update.
 * @param {string}         params.newStatus                  - The new status to set.
 * @param {Function}       params.apiCall                    - The API call function (saveEntityRecord or deleteEntityRecord).
 * @param {Function}       params.editEntityRecord           - The editEntityRecord dispatch function.
 * @param {Function}       params.updateCountsOptimistically - The updateCountsOptimistically dispatch function.
 * @param {QueryParams}    params.queryParams                - The query params for count updates.
 * @return {Promise<StatusChangeResult>} The result of the status change operation.
 */
const processStatusChange = async ( {
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
	} );

	// Call API with timeout
	const promises = await Promise.allSettled(
		items.map( ( { id } ) => withTimeout( apiCall( id ) ) as Promise< { id: number } > )
	);

	// Check for both rejected promises and fulfilled promises with undefined/invalid results
	// const itemsUpdated: PromiseFulfilledResult< { id: number } >[] = [];
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
	} );

	return {
		itemsUpdated,
		itemsFailed,
		numberOfErrors: itemsFailed.length,
	};
};

export const BULK_ACTIONS = {
	markAsSpam: 'mark_as_spam',
	markAsNotSpam: 'mark_as_not_spam',
};

export const viewAction: Action = {
	id: 'view-response',
	isPrimary: true,
	icon: <Icon icon={ commentContent } />,
	label: __( 'View', 'jetpack-forms' ),
	modalHeader: __( 'Response', 'jetpack-forms' ),
};

export const editFormAction: Action = {
	id: 'edit-form',
	isPrimary: false,
	icon: <Icon icon={ backup } />,
	label: __( 'Edit form', 'jetpack-forms' ),
	isEligible: item => !! item?.edit_form_url,
	supportsBulk: false,
	async callback( items ) {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
			action: 'edit-form',
			multiple: false,
		} );

		const [ item ] = items;

		if ( item?.edit_form_url ) {
			const url = new URL( item.edit_form_url, window.location.origin );
			// redirect to the form edit page
			window.location.href = url.toString();
		}
	},
};

export const markAsSpamAction: Action = {
	id: 'mark-as-spam',
	isPrimary: true,
	icon: <Icon icon={ spam } />,
	label: __( 'Spam', 'jetpack-forms' ),
	isEligible: item => item.status !== 'spam',
	supportsBulk: true,
	async callback( items, { registry }, { isUndo = false } = {} ) {
		let undoTriggered = false;
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
			action: 'mark-as-spam',
			multiple: items.length > 1,
		} );

		const { createSuccessNotice, createErrorNotice, createInfoNotice, removeNotice } =
			registry.dispatch( noticesStore );
		const { saveEntityRecord, editEntityRecord } = registry.dispatch( coreStore );
		const { updateCountsOptimistically, addPendingAction, removePendingAction } =
			registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );
		const actionId = `mark-as-spam-${ Date.now() }-${ items.map( i => i.id ).join( '-' ) }`;

		const busyMessage = isUndo
			? undoingMessage
			: sprintf(
					/* translators: %d: the number of responses. */
					_n(
						'Moving %d response to spam…',
						'Moving %d responses to spam…',
						items.length,
						'jetpack-forms'
					),
					items.length
			  );

		createInfoNotice( busyMessage, {
			type: 'snackbar',
			id: 'mark-as-spam-action',
			icon: <Spinner />,
		} );

		addPendingAction( actionId );

		let waitForRecordsPromise: Promise< void > | null = null;

		try {
			const { itemsUpdated, numberOfErrors } = await processStatusChange( {
				items,
				newStatus: 'spam',
				apiCall: ( id: number ) =>
					saveEntityRecord( 'postType', 'feedback', { id, status: 'spam' } ),
				editEntityRecord,
				updateCountsOptimistically,
				queryParams,
			} );

			// If there is at least one successful update, invalidate the cache and navigate if needed
			if ( itemsUpdated.length ) {
				waitForRecordsPromise = new Promise( resolve => {
					setTimeout( () => {
						if ( undoTriggered ) {
							resolve();
							return;
						}

						let status = 'inbox';
						if ( items[ 0 ]?.status === 'trash' ) {
							status = 'trash';
						}

						invalidateCacheAndNavigate( registry, getCurrentQuery(), queryParams, status );

						if ( undoTriggered ) {
							resolve();
							return;
						}

						waitForEntityRecordsResolution( registry, getCurrentQuery() ).finally( resolve );
					}, 0 );
				} );
				// Store promise so undo can wait for it
				pendingRefetches.set( actionId, waitForRecordsPromise );
			}

			if ( numberOfErrors === 0 ) {
				// Every request was successful.
				const successMessage =
					items.length === 1
						? __( 'Response marked as spam.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: the number of responses. */
								_n(
									'%d response marked as spam.',
									'%d responses marked as spam.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				if ( ! isUndo ) {
					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: 'mark-as-spam-action',
						actions: [
							{
								label: __( 'Undo', 'jetpack-forms' ),
								onClick: async () => {
									undoTriggered = true;

									// Wait for the original action's refetch to complete before undoing
									const originalRefetch = pendingRefetches.get( actionId );
									if ( originalRefetch ) {
										await originalRefetch;
										pendingRefetches.delete( actionId );
									}

									// Remove the original pending action before starting undo
									removePendingAction( actionId );
									markAsNotSpamAction.callback( items, { registry }, { isUndo: true } );
								},
							},
						],
					} );
				} else {
					// Remove the info notice when undo completes successfully
					removeNotice( 'mark-as-spam-action' );
				}
			} else {
				// There is at least one failure.
				const errorMessage = getGenericErrorMessage( numberOfErrors );

				// Remove the info notice on error
				removeNotice( 'mark-as-spam-action' );
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}

			// Make the REST request which performs the `contact_form_akismet` `spam` action.
			if ( itemsUpdated.length ) {
				registry.dispatch( dashboardStore ).doBulkAction(
					itemsUpdated.map( item => item.id.toString() ),
					BULK_ACTIONS.markAsSpam
				);
			}
		} finally {
			if ( waitForRecordsPromise ) {
				await waitForRecordsPromise;
			}

			// Clean up
			pendingRefetches.delete( actionId );
			removePendingAction( actionId );
		}
	},
};

export const markAsNotSpamAction: Action = {
	id: 'mark-as-not-spam',
	isPrimary: true,
	icon: <Icon icon={ notSpam } />,
	label: __( 'Not spam', 'jetpack-forms' ),
	isEligible: item => item.status === 'spam',
	supportsBulk: true,
	async callback( items, { registry }, { isUndo = false } = {} ) {
		let undoTriggered = false;
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
			action: 'mark-as-not-spam',
			multiple: items.length > 1,
		} );

		const { createSuccessNotice, createErrorNotice, createInfoNotice, removeNotice } =
			registry.dispatch( noticesStore );
		const { saveEntityRecord, editEntityRecord } = registry.dispatch( coreStore );
		const { updateCountsOptimistically, addPendingAction, removePendingAction } =
			registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );
		const actionId = `mark-as-not-spam-${ Date.now() }-${ items.map( i => i.id ).join( '-' ) }`;

		const busyMessage = isUndo
			? undoingMessage
			: sprintf(
					/* translators: %d: the number of responses. */
					_n(
						'Marking %d response as not spam…',
						'Marking %d responses as not spam…',
						items.length,
						'jetpack-forms'
					),
					items.length
			  );

		createInfoNotice( busyMessage, {
			type: 'snackbar',
			id: 'mark-as-not-spam-action',
			icon: <Spinner />,
		} );

		addPendingAction( actionId );

		let waitForRecordsPromise: Promise< void > | null = null;

		try {
			const { itemsUpdated, numberOfErrors } = await processStatusChange( {
				items,
				newStatus: 'publish',
				apiCall: ( id: number ) =>
					saveEntityRecord( 'postType', 'feedback', { id, status: 'publish' } ),
				editEntityRecord,
				updateCountsOptimistically,
				queryParams,
			} );

			// If there is at least one successful update, invalidate the cache and navigate if needed
			if ( itemsUpdated.length ) {
				waitForRecordsPromise = new Promise( resolve => {
					setTimeout( () => {
						if ( undoTriggered ) {
							resolve();
							return;
						}

						invalidateCacheAndNavigate( registry, getCurrentQuery(), queryParams, 'spam' );

						if ( undoTriggered ) {
							resolve();
							return;
						}

						waitForEntityRecordsResolution( registry, getCurrentQuery() ).finally( resolve );
					}, 0 );
				} );
				// Store promise so undo can wait for it
				pendingRefetches.set( actionId, waitForRecordsPromise );
			}

			if ( numberOfErrors === 0 ) {
				// Every request was successful.
				const successMessage =
					items.length === 1
						? __( 'Response marked as not spam.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: the number of responses. */
								_n(
									'%d response marked as not spam.',
									'%d responses marked as not spam.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				if ( ! isUndo ) {
					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: 'mark-as-not-spam-action',
						actions: [
							{
								label: __( 'Undo', 'jetpack-forms' ),
								onClick: async () => {
									undoTriggered = true;

									// Wait for the original action's refetch to complete before undoing
									const originalRefetch = pendingRefetches.get( actionId );
									if ( originalRefetch ) {
										await originalRefetch;
										pendingRefetches.delete( actionId );
									}

									// Remove the original pending action before starting undo
									removePendingAction( actionId );
									markAsSpamAction.callback( items, { registry }, { isUndo: true } );
								},
							},
						],
					} );
				} else {
					removeNotice( 'mark-as-not-spam-action' );
				}
			} else {
				// There is at least one failure.
				const errorMessage = getGenericErrorMessage( numberOfErrors );

				removeNotice( 'mark-as-not-spam-action' );
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
			// Make the REST request which performs the `contact_form_akismet` `ham` action.
			if ( itemsUpdated.length ) {
				registry.dispatch( dashboardStore ).doBulkAction(
					itemsUpdated.map( item => item.id.toString() ),
					BULK_ACTIONS.markAsNotSpam
				);
			}
		} finally {
			if ( waitForRecordsPromise ) {
				await waitForRecordsPromise;
			}

			// Clean up
			pendingRefetches.delete( actionId );
			removePendingAction( actionId );
		}
	},
};

export const restoreAction: Action = {
	id: 'restore',
	isPrimary: true,
	icon: <Icon icon={ backup } />,
	label: __( 'Restore', 'jetpack-forms' ),
	isEligible: item => item.status === 'trash',
	supportsBulk: true,
	async callback( items, { registry }, { isUndo = false, targetStatus = 'publish' } = {} ) {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
			action: 'restore',
			multiple: items.length > 1,
		} );

		const { saveEntityRecord, editEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice, createInfoNotice, removeNotice } =
			registry.dispatch( noticesStore );
		const { updateCountsOptimistically, addPendingAction, removePendingAction } =
			registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );
		const newStatus = targetStatus === 'trash' ? 'publish' : targetStatus;
		const actionId = `restore-${ Date.now() }-${ items.map( i => i.id ).join( '-' ) }`;

		const busyMessage = isUndo
			? undoingMessage
			: sprintf(
					/* translators: %d: the number of responses. */
					_n( 'Restoring %d response…', 'Restoring %d responses…', items.length, 'jetpack-forms' ),
					items.length
			  );

		createInfoNotice( busyMessage, {
			type: 'snackbar',
			id: 'restore-action',
			icon: <Spinner />,
		} );

		addPendingAction( actionId );

		let waitForRecordsPromise: Promise< void > | null = null;

		try {
			const { itemsUpdated, numberOfErrors } = await processStatusChange( {
				items,
				newStatus,
				apiCall: ( id: number ) =>
					saveEntityRecord( 'postType', 'feedback', { id, status: newStatus } ),
				editEntityRecord,
				updateCountsOptimistically,
				queryParams,
			} );

			// If there is at least one successful update, invalidate the cache and navigate if needed
			if ( itemsUpdated.length ) {
				invalidateCacheAndNavigate( registry, getCurrentQuery(), queryParams, 'trash' );
				waitForRecordsPromise = waitForEntityRecordsResolution( registry, getCurrentQuery() );
				// Store promise so undo can wait for it
				pendingRefetches.set( actionId, waitForRecordsPromise );
			}

			if ( numberOfErrors === 0 ) {
				const successMessage =
					items.length === 1
						? __( 'Response restored.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: the number of responses. */
								_n(
									'%d response restored.',
									'%d responses restored.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				if ( ! isUndo ) {
					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: 'restore-action',
						actions: [
							{
								label: __( 'Undo', 'jetpack-forms' ),
								onClick: async () => {
									// Wait for the original action's refetch to complete before undoing
									const originalRefetch = pendingRefetches.get( actionId );
									if ( originalRefetch ) {
										await originalRefetch;
										pendingRefetches.delete( actionId );
									}

									// Remove the original pending action before starting undo
									removePendingAction( actionId );
									moveToTrashAction.callback( items, { registry }, { isUndo: true } );
								},
							},
						],
					} );
				} else {
					removeNotice( 'restore-action' );
				}

				return;
			}

			// There is at least one failure.
			const errorMessage = getGenericErrorMessage( numberOfErrors );

			removeNotice( 'restore-action' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		} finally {
			if ( waitForRecordsPromise ) {
				await waitForRecordsPromise;
			}

			// Clean up
			pendingRefetches.delete( actionId );
			removePendingAction( actionId );
		}
	},
};

export const moveToTrashAction: Action = {
	id: 'move-to-trash',
	isPrimary: true,
	icon: <Icon icon={ trash } />,
	label: __( 'Trash', 'jetpack-forms' ),
	isEligible: item => item.status !== 'trash',
	supportsBulk: true,
	async callback( items, { registry }, { isUndo = false } = {} ) {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
			action: 'move-to-trash',
			multiple: items.length > 1,
		} );

		const { deleteEntityRecord, editEntityRecord, receiveEntityRecords } =
			registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice, createInfoNotice, removeNotice } =
			registry.dispatch( noticesStore );
		const { updateCountsOptimistically, addPendingAction, removePendingAction } =
			registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );
		const previousStatus = items[ 0 ]?.status; // All items have the same status
		const actionId = `move-to-trash-${ Date.now() }-${ items.map( i => i.id ).join( '-' ) }`;

		const busyMessage = isUndo
			? undoingMessage
			: sprintf(
					/* translators: %d: the number of responses. */
					_n(
						'Moving %d response to trash…',
						'Moving %d responses to trash…',
						items.length,
						'jetpack-forms'
					),
					items.length
			  );

		createInfoNotice( busyMessage, {
			type: 'snackbar',
			id: 'move-to-trash-action',
			icon: <Spinner />,
		} );

		addPendingAction( actionId );

		let waitForRecordsPromise: Promise< void > | null = null;

		try {
			const { itemsUpdated, numberOfErrors } = await processStatusChange( {
				items,
				newStatus: 'trash',
				apiCall: ( id: number ) =>
					deleteEntityRecord( 'postType', 'feedback', id, {}, { throwOnError: true } ),
				editEntityRecord,
				updateCountsOptimistically,
				queryParams,
			} );

			// If there is at least one successful update, invalidate the cache and navigate if needed
			if ( itemsUpdated.length ) {
				let status = 'inbox';
				if ( items[ 0 ]?.status === 'trash' ) {
					status = 'trash';
				}
				invalidateCacheAndNavigate( registry, getCurrentQuery(), queryParams, status );
				waitForRecordsPromise = waitForEntityRecordsResolution( registry, getCurrentQuery() );
				// Store promise so undo can wait for it
				pendingRefetches.set( actionId, waitForRecordsPromise );
			}

			if ( numberOfErrors === 0 ) {
				const successMessage =
					items.length === 1
						? __( 'Response moved to trash.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: the number of responses. */
								_n(
									'%d response moved to trash.',
									'%d responses moved to trash.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				if ( ! isUndo ) {
					// Reload the items to the store, as they were removed from the store when moved to trash
					receiveEntityRecords( 'postType', 'feedback', items, queryParams, true );

					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: 'move-to-trash-action',
						actions: [
							{
								label: __( 'Undo', 'jetpack-forms' ),
								onClick: async () => {
									// Wait for the original action's refetch to complete before undoing
									const originalRefetch = pendingRefetches.get( actionId );
									if ( originalRefetch ) {
										await originalRefetch;
										pendingRefetches.delete( actionId );
									}

									// Remove the original pending action before starting undo
									removePendingAction( actionId );
									restoreAction.callback(
										items,
										{ registry },
										// We can trash a spam or inbox item, so we need to restore to the original status
										{ isUndo: true, targetStatus: previousStatus }
									);
								},
							},
						],
					} );
				} else {
					removeNotice( 'move-to-trash-action' );
				}

				return;
			}

			// There is at least one failure.
			const errorMessage = getGenericErrorMessage( numberOfErrors );

			removeNotice( 'move-to-trash-action' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		} finally {
			if ( waitForRecordsPromise ) {
				await waitForRecordsPromise;
			}

			// Clean up
			pendingRefetches.delete( actionId );
			removePendingAction( actionId );
		}
	},
};

export const deleteAction: Action = {
	id: 'delete',
	isPrimary: true,
	icon: <Icon icon={ trash } />,
	label: __( 'Delete', 'jetpack-forms' ),
	isEligible: item => item.status === 'trash',
	supportsBulk: true,
	async callback( items, { registry } ) {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
			action: 'delete',
			multiple: items.length > 1,
		} );

		const { deleteEntityRecord } = registry.dispatch( coreStore );
		const { invalidateFilters, updateCountsOptimistically } = registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );

		items.forEach( () => {
			updateCountsOptimistically( 'trash', 'deleted', 1, queryParams );
		} );

		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				deleteEntityRecord( 'postType', 'feedback', id, { force: true }, { throwOnError: true } )
			)
		);

		const itemsUpdated = promises.filter( ( { status } ) => status === 'fulfilled' );

		// If there is at least one successful update, invalidate the cache for filters.
		if ( itemsUpdated.length ) {
			invalidateFilters();
			invalidateCacheAndNavigate( registry, getCurrentQuery(), queryParams, 'trash' );
		}

		if ( itemsUpdated.length === items.length ) {
			// Every request was successful.
			const successMessage =
				items.length === 1
					? __( 'Response deleted permanently.', 'jetpack-forms' )
					: sprintf(
							/* translators: %d: the number of responses. */
							_n(
								'%d response deleted permanently.',
								'%d responses deleted permanently.',
								items.length,
								'jetpack-forms'
							),
							items.length
					  );

			createSuccessNotice( successMessage, { type: 'snackbar', id: 'move-to-trash-action' } );

			// Update the URL to remove references to deleted items.
			// Parse the hash to extract just the query params (e.g., #/responses?r=1,2,3)
			const hash = window.location.hash;
			const hashQueryIndex = hash.indexOf( '?' );
			const hashBase = hashQueryIndex > 0 ? hash.substring( 0, hashQueryIndex ) : hash;
			const hashQuery = hashQueryIndex > 0 ? hash.substring( hashQueryIndex + 1 ) : '';

			const hashParams = new URLSearchParams( hashQuery );
			const currentSelection = hashParams.get( 'r' )?.split( ',' ) || [];
			const deletedIds = items.map( ( { id } ) => id.toString() );
			const newSelection = currentSelection.filter( id => ! deletedIds.includes( id ) );

			if ( newSelection.length ) {
				hashParams.set( 'r', newSelection.join( ',' ) );
			} else {
				hashParams.delete( 'r' );
			}

			const hashString = hashParams.toString();
			window.location.hash = hashString ? `${ hashBase }?${ hashString }` : hashBase;

			return;
		}
		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		const errorMessage = getGenericErrorMessage( numberOfErrors );

		createErrorNotice( errorMessage, { type: 'snackbar' } );
	},
};

export const markAsReadAction: Action = {
	id: 'mark-as-read',
	isPrimary: false,
	icon: <Icon icon={ seen } />,
	label: __( 'Mark as read', 'jetpack-forms' ),
	isEligible: item => item.is_unread,
	supportsBulk: true,
	async callback( items, { registry } ) {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
			action: 'mark-as-read',
			multiple: items.length > 1,
		} );

		const { editEntityRecord } = registry.dispatch( coreStore );
		const { getEntityRecord } = registry.select( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const { invalidateCounts, markRecordsAsInvalid } = registry.dispatch( dashboardStore );

		const promises = await Promise.allSettled(
			items.map( async ( { id, status } ) => {
				// Get current entity from store
				const currentEntity = getEntityRecord( 'postType', 'feedback', id );

				// Optimistically update entity in store
				if ( currentEntity ) {
					editEntityRecord( 'postType', 'feedback', id, {
						is_unread: false,
					} );

					// Immediately update menu counters optimistically to avoid delays, but only for inbox
					if ( status === 'publish' ) {
						updateMenuCounterOptimistically( -1 );
					}
				}

				// Update on server
				return apiFetch( {
					path: `/wp/v2/feedback/${ id }/read`,
					method: 'POST',
					data: { is_unread: false },
				} )
					.then( ( { count } ) => {
						// Update menu counter with accurate count from server.
						updateMenuCounter( count );
					} )
					.catch( () => {
						// Revert the change in the store if the server update fails.
						if ( currentEntity ) {
							editEntityRecord( 'postType', 'feedback', id, {
								is_unread: true,
							} );

							// Revert the optimistic change in the sidebar.
							if ( status === 'publish' ) {
								updateMenuCounterOptimistically( 1 );
							}
						}

						throw new Error( 'Failed to mark as read' );
					} );
			} )
		);

		// If there is at least one successful update, invalidate the cache for counts.
		if ( promises.some( ( { status } ) => status === 'fulfilled' ) ) {
			invalidateCounts();
			// Mark successfully updated records as invalid instead of removing from view

			const updatedIds = items
				.filter( ( _, index ) => promises[ index ]?.status === 'fulfilled' )
				.map( item => item.id );

			markRecordsAsInvalid( updatedIds );
		}

		if ( promises.every( ( { status } ) => status === 'fulfilled' ) ) {
			// Every request was successful.
			const successMessage =
				items.length === 1
					? __( 'Response marked as read.', 'jetpack-forms' )
					: sprintf(
							/* translators: %d: the number of responses. */
							_n(
								'%d response marked as read.',
								'%d responses marked as read.',
								items.length,
								'jetpack-forms'
							),
							items.length
					  );

			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'mark-as-read-action',
				actions: [
					{
						label: __( 'Undo', 'jetpack-forms' ),
						onClick: () => {
							markAsUnreadAction.callback( items, { registry } );
						},
					},
				],
			} );

			return;
		}

		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		const errorMessage = getGenericErrorMessage( numberOfErrors );

		createErrorNotice( errorMessage, { type: 'snackbar' } );
	},
};

export const markAsUnreadAction: Action = {
	id: 'mark-as-unread',
	isPrimary: false,
	icon: <Icon icon={ unseen } />,
	label: __( 'Mark as unread', 'jetpack-forms' ),
	isEligible: item => ! item.is_unread,
	supportsBulk: true,
	async callback( items, { registry } ) {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
			action: 'mark-as-unread',
			multiple: items.length > 1,
		} );

		const { editEntityRecord } = registry.dispatch( coreStore );
		const { getEntityRecord } = registry.select( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const { invalidateCounts, markRecordsAsInvalid } = registry.dispatch( dashboardStore );

		const promises = await Promise.allSettled(
			items.map( async ( { id, status } ) => {
				// Get current entity from store
				const currentEntity = getEntityRecord( 'postType', 'feedback', id );

				// Optimistically update entity in store
				if ( currentEntity ) {
					editEntityRecord( 'postType', 'feedback', id, {
						is_unread: true,
					} );

					// Immediately update menu counters optimistically to avoid delays, but only for inbox
					if ( status === 'publish' ) {
						updateMenuCounterOptimistically( 1 );
					}
				}

				// Update on server
				return apiFetch( {
					path: `/wp/v2/feedback/${ id }/read`,
					method: 'POST',
					data: { is_unread: true },
				} )
					.then( ( { count } ) => {
						// Update menu counter with accurate count from server.
						updateMenuCounter( count );
					} )
					.catch( () => {
						// Revert the change in the store if the server update fails.
						if ( currentEntity ) {
							editEntityRecord( 'postType', 'feedback', id, {
								is_unread: false,
							} );

							// Revert the optimistic change in the sidebar.
							if ( status === 'publish' ) {
								updateMenuCounterOptimistically( -1 );
							}
						}

						throw new Error( 'Failed to mark as unread' );
					} );
			} )
		);

		if ( promises.every( ( { status } ) => status === 'fulfilled' ) ) {
			// Invalidate counts cache to ensure counts are refetched and stay accurate
			invalidateCounts();
			// Mark successfully updated records as invalid instead of removing from view
			const updatedIds = items.map( item => item.id );
			markRecordsAsInvalid( updatedIds );

			const successMessage =
				items.length === 1
					? __( 'Response marked as unread.', 'jetpack-forms' )
					: sprintf(
							/* translators: %d: the number of responses. */
							_n(
								'%d response marked as unread.',
								'%d responses marked as unread.',
								items.length,
								'jetpack-forms'
							),
							items.length
					  );

			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'mark-as-unread-action',
				actions: [
					{
						label: __( 'Undo', 'jetpack-forms' ),
						onClick: () => {
							markAsReadAction.callback( items, { registry } );
						},
					},
				],
			} );

			return;
		}

		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		const errorMessage = getGenericErrorMessage( numberOfErrors );

		createErrorNotice( errorMessage, { type: 'snackbar' } );
	},
};
