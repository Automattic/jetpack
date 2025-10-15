import apiFetch from '@wordpress/api-fetch';
import { Icon } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { seen, unseen, trash, backup, commentContent } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { notSpam, spam } from '../../icons';
import { store as dashboardStore } from '../../store';
import { updateMenuCounter, updateMenuCounterOptimistically } from '../utils';

/**
 * Helper function to extract count-relevant query params from the current query.
 *
 * @param {object} currentQuery - The current query from the store.
 * @return {object} Query params relevant for count caching.
 */
const getCountQueryParams = currentQuery => {
	const queryParams = {};
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

export const BULK_ACTIONS = {
	markAsSpam: 'mark_as_spam',
	markAsNotSpam: 'mark_as_not_spam',
};

export const viewAction = {
	id: 'view-response',
	icon: <Icon icon={ commentContent } />,
	isPrimary: true,
	label: __( 'View response', 'jetpack-forms' ),
	modalHeader: __( 'Response', 'jetpack-forms' ),
};

export const editFormAction = {
	id: 'edit-form',
	label: __( 'Edit form', 'jetpack-forms' ),
	icon: <Icon icon={ backup } />,
	isEligible: item => !! item?.edit_form_url,
	supportsBulk: false,
	async callback( items ) {
		const [ item ] = items;
		if ( item?.edit_form_url ) {
			const url = new URL( item.edit_form_url, window.location.origin );
			// redirect to the form edit page
			window.location.href = url.toString();
		}
	},
};

// TODO: We should probably have better error messages in case of failure.
const getGenericErrorMessage = numberOfErrors => {
	return numberOfErrors.length === 1
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

export const markAsSpamAction = {
	id: 'mark-as-spam',
	label: __( 'Mark as spam', 'jetpack-forms' ),
	isEligible: item => item.status !== 'spam',
	supportsBulk: true,
	icon: <Icon icon={ spam } />,
	async callback( items, { registry } ) {
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const { updateCountsOptimistically } = registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );

		items.forEach( item => {
			updateCountsOptimistically( item.status, 'spam', 1, queryParams );
		} );

		const promises = await Promise.allSettled(
			items.map( ( { id } ) => saveEntityRecord( 'postType', 'feedback', { id, status: 'spam' } ) )
		);
		const itemsUpdated = promises.filter( ( { status } ) => status === 'fulfilled' );
		if ( itemsUpdated.length === items.length ) {
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
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'mark-as-spam-action',
				actions: [
					{
						label: __( 'Undo', 'jetpack-forms' ),
						onClick: () => {
							markAsNotSpamAction.callback( items, { registry } );
						},
					},
				],
			} );
		} else {
			// There is at least one failure.
			const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
			const errorMessage = getGenericErrorMessage( numberOfErrors );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
		// Make the REST request which performs the `contact_form_akismet` `ham` action.
		if ( itemsUpdated.length ) {
			registry.dispatch( dashboardStore ).doBulkAction(
				itemsUpdated.map( ( { value } ) => value.id ),
				BULK_ACTIONS.markAsSpam
			);
		}
	},
};

export const markAsNotSpamAction = {
	id: 'mark-as-not-spam',
	label: __( 'Not spam', 'jetpack-forms' ),
	isEligible: item => item.status === 'spam',
	supportsBulk: true,
	icon: <Icon icon={ notSpam } />,
	async callback( items, { registry } ) {
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const { updateCountsOptimistically } = registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );

		items.forEach( () => {
			updateCountsOptimistically( 'spam', 'publish', 1, queryParams );
		} );

		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				saveEntityRecord( 'postType', 'feedback', { id, status: 'publish' } )
			)
		);
		const itemsUpdated = promises.filter( ( { status } ) => status === 'fulfilled' );
		if ( itemsUpdated.length === items.length ) {
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
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'mark-as-not-spam-action',
				actions: [
					{
						label: __( 'Undo', 'jetpack-forms' ),
						onClick: () => {
							markAsSpamAction.callback( items, { registry } );
						},
					},
				],
			} );
		} else {
			// There is at least one failure.
			const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
			const errorMessage = getGenericErrorMessage( numberOfErrors );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
		// Make the REST request which performs the `contact_form_akismet` `ham` action.
		if ( itemsUpdated.length ) {
			registry.dispatch( dashboardStore ).doBulkAction(
				itemsUpdated.map( ( { value } ) => value.id ),
				BULK_ACTIONS.markAsNotSpam
			);
		}
	},
};

export const restoreAction = {
	id: 'restore',
	label: __( 'Restore', 'jetpack-forms' ),
	isEligible: item => item.status === 'trash',
	supportsBulk: true,
	icon: <Icon icon={ backup } />,
	async callback( items, { registry } ) {
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const { updateCountsOptimistically } = registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );

		items.forEach( () => {
			updateCountsOptimistically( 'trash', 'publish', 1, queryParams );
		} );

		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				saveEntityRecord( 'postType', 'feedback', { id, status: 'publish' } )
			)
		);
		if ( promises.every( ( { status } ) => status === 'fulfilled' ) ) {
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
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'restore-action',
				actions: [
					{
						label: __( 'Undo', 'jetpack-forms' ),
						onClick: () => {
							moveToTrashAction.callback( items, { registry } );
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

export const moveToTrashAction = {
	id: 'move-to-trash',
	label: __( 'Move to trash', 'jetpack-forms' ),
	isEligible: item => item.status !== 'trash',
	isPrimary: true,
	supportsBulk: true,
	icon: <Icon icon={ trash } />,
	async callback( items, { registry } ) {
		const { deleteEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const { updateCountsOptimistically } = registry.dispatch( dashboardStore );
		const { getCurrentQuery } = registry.select( dashboardStore );

		const queryParams = getCountQueryParams( getCurrentQuery() );

		items.forEach( item => {
			updateCountsOptimistically( item.status, 'trash', 1, queryParams );
		} );

		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				deleteEntityRecord( 'postType', 'feedback', id, {}, { throwOnError: true } )
			)
		);
		if ( promises.every( ( { status } ) => status === 'fulfilled' ) ) {
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
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'move-to-trash-action',
				actions: [
					{
						label: __( 'Undo', 'jetpack-forms' ),
						onClick: () => {
							restoreAction.callback( items, { registry } );
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

export const deleteAction = {
	id: 'delete',
	label: __( 'Delete permanently', 'jetpack-forms' ),
	isEligible: item => item.status === 'trash',
	supportsBulk: true,
	icon: <Icon icon={ trash } />,
	async callback( items, { registry } ) {
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
			return;
		}
		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		const errorMessage = getGenericErrorMessage( numberOfErrors );
		createErrorNotice( errorMessage, { type: 'snackbar' } );
	},
};

export const markAsReadAction = {
	id: 'mark-as-read',
	label: __( 'Mark as read', 'jetpack-forms' ),
	isEligible: item => item.is_unread,
	supportsBulk: true,
	icon: <Icon icon={ seen } />,
	async callback( items, { registry } ) {
		// const { receiveEntityRecords, editEntityRecord } = registry.dispatch( coreStore );
		const { editEntityRecord } = registry.dispatch( coreStore );
		const { getEntityRecord } = registry.select( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );

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
		if ( promises.every( ( { status } ) => status === 'fulfilled' ) ) {
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

export const markAsUnreadAction = {
	id: 'mark-as-unread',
	label: __( 'Mark as unread', 'jetpack-forms' ),
	isEligible: item => ! item.is_unread,
	supportsBulk: true,
	icon: <Icon icon={ unseen } />,
	async callback( items, { registry } ) {
		const { editEntityRecord } = registry.dispatch( coreStore );
		const { getEntityRecord } = registry.select( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
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
