/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../../src/dashboard/store';
/**
 * Types
 */
import type { FormResponse } from '../../src/types/index.ts';
import type { Action } from '@wordpress/dataviews';

type GetItemId = ( item: FormResponse ) => string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigateFunction = ( options: any ) => void;
type SearchParams = {
	[ key: string ]: string | string[] | undefined;
};

type ActionWithDestructive< T > = Action< T > & {
	isDestructive?: boolean;
};

type QueryParams = {
	status: string;
	per_page?: number;
	page?: number;
	orderby?: string;
	order?: string;
	is_unread?: boolean;
	parent?: string;
	before?: string;
	after?: string;
	search?: string;
};

type GetActionsParams = {
	navigate: NavigateFunction;
	searchParams: SearchParams;
	view: string | undefined;
	getItemId: GetItemId;
	queryParams: QueryParams;
};

/**
 * Get actions configuration for form responses DataViews.
 *
 * @param {GetActionsParams} params - Parameters for generating actions.
 * @return {ActionWithDestructive<FormResponse>[]} Array of action configurations.
 */
export function getActions( {
	navigate,
	searchParams,
	view,
	getItemId,
	queryParams,
}: GetActionsParams ): ActionWithDestructive< FormResponse >[] {
	const baseActions: ActionWithDestructive< FormResponse >[] = [
		{
			id: 'view-details',
			label: __( 'View', 'jetpack-forms' ),
			isPrimary: true,
			callback: items => {
				const ids = items.map( item => getItemId( item ) );
				navigate( {
					search: {
						...searchParams,
						responseIds: ids,
					},
				} );
			},
		},
	];

	if ( view === 'inbox' || ! view ) {
		return [
			...baseActions,
			{
				id: 'mark-as-read',
				label: __( 'Mark as read', 'jetpack-forms' ),
				supportsBulk: true,
				isEligible: ( item: FormResponse ) => item.is_unread,
				callback: async ( items, { registry } ) => {
					const { editEntityRecord, invalidateResolution } = registry.dispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );

					// Optimistic update
					items.forEach( item => {
						editEntityRecord( 'postType', 'feedback', item.id, { is_unread: false } );
					} );

					const message =
						items.length === 1
							? __( 'Response marked as read.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of responses */
									_n(
										'%d response marked as read.',
										'%d responses marked as read.',
										items.length,
										'jetpack-forms'
									),
									items.length
							  );
					createSuccessNotice( message, { type: 'snackbar' } );

					try {
						await Promise.all(
							items.map( item =>
								apiFetch( {
									path: `/wp/v2/feedback/${ item.id }/read`,
									method: 'POST',
									data: { is_unread: false },
								} )
							)
						);
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
					} catch {
						// Revert optimistic update
						items.forEach( item => {
							editEntityRecord( 'postType', 'feedback', item.id, { is_unread: true } );
						} );
						createErrorNotice( __( 'Failed to mark as read.', 'jetpack-forms' ), {
							type: 'snackbar',
						} );
					}
				},
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'mark-as-spam',
				label: __( 'Spam', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				isPrimary: true,
				callback: async ( items, { registry } ) => {
					const { editEntityRecord, saveEntityRecord, invalidateResolution } =
						registry.dispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
					const { updateCountsOptimistically, invalidateCounts } =
						registry.dispatch( dashboardStore );

					const originalStatuses = items.map( item => item.status );

					// Optimistic update
					items.forEach( item => {
						editEntityRecord( 'postType', 'feedback', item.id, { status: 'spam' } );
						updateCountsOptimistically( item.status, 'spam', 1 );
					} );
					navigate( {
						search: {
							...searchParams,
							responseIds: undefined,
						},
					} );

					const message =
						items.length === 1
							? __( 'Response marked as spam.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of responses */
									_n(
										'%d response marked as spam.',
										'%d responses marked as spam.',
										items.length,
										'jetpack-forms'
									),
									items.length
							  );
					createSuccessNotice( message, { type: 'snackbar' } );

					try {
						await Promise.all(
							items.map( item =>
								saveEntityRecord( 'postType', 'feedback', {
									id: item.id,
									status: 'spam',
								} )
							)
						);
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
						invalidateCounts();
					} catch {
						// Revert optimistic update
						items.forEach( ( item, index ) => {
							editEntityRecord( 'postType', 'feedback', item.id, {
								status: originalStatuses[ index ],
							} );
							updateCountsOptimistically( 'spam', originalStatuses[ index ], 1 );
						} );
						createErrorNotice( __( 'Failed to mark as spam.', 'jetpack-forms' ), {
							type: 'snackbar',
						} );
					}
				},
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'move-to-trash',
				label: __( 'Trash', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				isPrimary: true,
				callback: async ( items, { registry } ) => {
					const { editEntityRecord, deleteEntityRecord, invalidateResolution } =
						registry.dispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
					const { updateCountsOptimistically, invalidateCounts } =
						registry.dispatch( dashboardStore );

					const originalStatuses = items.map( item => item.status );

					// Optimistic update
					items.forEach( item => {
						editEntityRecord( 'postType', 'feedback', item.id, { status: 'trash' } );
						updateCountsOptimistically( item.status, 'trash', 1 );
					} );
					navigate( {
						search: {
							...searchParams,
							responseIds: undefined,
						},
					} );

					const message =
						items.length === 1
							? __( 'Response moved to trash.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of responses */
									_n(
										'%d response moved to trash.',
										'%d responses moved to trash.',
										items.length,
										'jetpack-forms'
									),
									items.length
							  );
					createSuccessNotice( message, { type: 'snackbar' } );

					try {
						await Promise.all(
							items.map( item =>
								deleteEntityRecord( 'postType', 'feedback', item.id, {}, { throwOnError: true } )
							)
						);
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
						invalidateCounts();
					} catch {
						// Revert optimistic update
						items.forEach( ( item, index ) => {
							editEntityRecord( 'postType', 'feedback', item.id, {
								status: originalStatuses[ index ],
							} );
							updateCountsOptimistically( 'trash', originalStatuses[ index ], 1 );
						} );
						createErrorNotice( __( 'Failed to move to trash.', 'jetpack-forms' ), {
							type: 'snackbar',
						} );
					}
				},
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'mark-as-unread',
				label: __( 'Mark as unread', 'jetpack-forms' ),
				supportsBulk: true,
				isEligible: ( item: FormResponse ) => ! item.is_unread,
				callback: async ( items, { registry } ) => {
					const { editEntityRecord, invalidateResolution } = registry.dispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );

					// Optimistic update
					items.forEach( item => {
						editEntityRecord( 'postType', 'feedback', item.id, { is_unread: true } );
					} );

					const message =
						items.length === 1
							? __( 'Response marked as unread.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of responses */
									_n(
										'%d response marked as unread.',
										'%d responses marked as unread.',
										items.length,
										'jetpack-forms'
									),
									items.length
							  );
					createSuccessNotice( message, { type: 'snackbar' } );

					try {
						await Promise.all(
							items.map( item =>
								apiFetch( {
									path: `/wp/v2/feedback/${ item.id }/read`,
									method: 'POST',
									data: { is_unread: true },
								} )
							)
						);
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
					} catch {
						// Revert optimistic update
						items.forEach( item => {
							editEntityRecord( 'postType', 'feedback', item.id, { is_unread: false } );
						} );
						createErrorNotice( __( 'Failed to mark as unread.', 'jetpack-forms' ), {
							type: 'snackbar',
						} );
					}
				},
			} as ActionWithDestructive< FormResponse >,
		];
	}

	if ( view === 'spam' ) {
		return [
			...baseActions,
			{
				id: 'not-spam',
				label: __( 'Not spam', 'jetpack-forms' ),
				supportsBulk: true,
				isPrimary: true,
				callback: async ( items, { registry } ) => {
					const { editEntityRecord, saveEntityRecord, invalidateResolution } =
						registry.dispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
					const { updateCountsOptimistically, invalidateCounts } =
						registry.dispatch( dashboardStore );

					const originalStatuses = items.map( item => item.status );

					// Optimistic update
					items.forEach( item => {
						editEntityRecord( 'postType', 'feedback', item.id, { status: 'publish' } );
						updateCountsOptimistically( item.status, 'publish', 1 );
					} );
					navigate( {
						search: {
							...searchParams,
							responseIds: undefined,
						},
					} );

					const message =
						items.length === 1
							? __( 'Response restored from spam.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of responses */
									_n(
										'%d response restored from spam.',
										'%d responses restored from spam.',
										items.length,
										'jetpack-forms'
									),
									items.length
							  );
					createSuccessNotice( message, { type: 'snackbar' } );

					try {
						await Promise.all(
							items.map( item =>
								saveEntityRecord( 'postType', 'feedback', {
									id: item.id,
									status: 'publish',
								} )
							)
						);
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
						invalidateCounts();
					} catch {
						// Revert optimistic update
						items.forEach( ( item, index ) => {
							editEntityRecord( 'postType', 'feedback', item.id, {
								status: originalStatuses[ index ],
							} );
							updateCountsOptimistically( 'publish', originalStatuses[ index ], 1 );
						} );
						createErrorNotice( __( 'Failed to restore from spam.', 'jetpack-forms' ), {
							type: 'snackbar',
						} );
					}
				},
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'move-to-trash',
				label: __( 'Trash', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				isPrimary: true,
				callback: async ( items, { registry } ) => {
					const { editEntityRecord, deleteEntityRecord, invalidateResolution } =
						registry.dispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
					const { updateCountsOptimistically, invalidateCounts } =
						registry.dispatch( dashboardStore );

					const originalStatuses = items.map( item => item.status );

					// Optimistic update
					items.forEach( item => {
						editEntityRecord( 'postType', 'feedback', item.id, { status: 'trash' } );
						updateCountsOptimistically( item.status, 'trash', 1 );
					} );
					navigate( {
						search: {
							...searchParams,
							responseIds: undefined,
						},
					} );

					const message =
						items.length === 1
							? __( 'Response moved to trash.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of responses */
									_n(
										'%d response moved to trash.',
										'%d responses moved to trash.',
										items.length,
										'jetpack-forms'
									),
									items.length
							  );
					createSuccessNotice( message, { type: 'snackbar' } );

					try {
						await Promise.all(
							items.map( item =>
								deleteEntityRecord( 'postType', 'feedback', item.id, {}, { throwOnError: true } )
							)
						);
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
						invalidateCounts();
					} catch {
						// Revert optimistic update
						items.forEach( ( item, index ) => {
							editEntityRecord( 'postType', 'feedback', item.id, {
								status: originalStatuses[ index ],
							} );
							updateCountsOptimistically( 'trash', originalStatuses[ index ], 1 );
						} );
						createErrorNotice( __( 'Failed to move to trash.', 'jetpack-forms' ), {
							type: 'snackbar',
						} );
					}
				},
			} as ActionWithDestructive< FormResponse >,
		];
	}

	if ( view === 'trash' ) {
		return [
			...baseActions,
			{
				id: 'restore',
				label: __( 'Restore', 'jetpack-forms' ),
				supportsBulk: true,
				isPrimary: true,
				callback: async ( items, { registry } ) => {
					const { editEntityRecord, saveEntityRecord, invalidateResolution } =
						registry.dispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
					const { updateCountsOptimistically, invalidateCounts } =
						registry.dispatch( dashboardStore );

					const originalStatuses = items.map( item => item.status );

					// Optimistic update
					items.forEach( item => {
						editEntityRecord( 'postType', 'feedback', item.id, { status: 'publish' } );
						updateCountsOptimistically( item.status, 'publish', 1 );
					} );
					navigate( {
						search: {
							...searchParams,
							responseIds: undefined,
						},
					} );

					const message =
						items.length === 1
							? __( 'Response restored.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of responses */
									_n(
										'%d response restored.',
										'%d responses restored.',
										items.length,
										'jetpack-forms'
									),
									items.length
							  );
					createSuccessNotice( message, { type: 'snackbar' } );

					try {
						await Promise.all(
							items.map( item =>
								saveEntityRecord( 'postType', 'feedback', {
									id: item.id,
									status: 'publish',
								} )
							)
						);
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
						invalidateCounts();
					} catch {
						// Revert optimistic update
						items.forEach( ( item, index ) => {
							editEntityRecord( 'postType', 'feedback', item.id, {
								status: originalStatuses[ index ],
							} );
							updateCountsOptimistically( 'publish', originalStatuses[ index ], 1 );
						} );
						createErrorNotice( __( 'Failed to restore.', 'jetpack-forms' ), {
							type: 'snackbar',
						} );
					}
				},
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'delete-permanently',
				label: __( 'Delete', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				isPrimary: true,
				callback: async ( items, { registry } ) => {
					const { deleteEntityRecord, invalidateResolution } = registry.dispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
					const { updateCountsOptimistically, invalidateCounts } =
						registry.dispatch( dashboardStore );

					// Optimistic update - decrease trash count
					items.forEach( item => {
						updateCountsOptimistically( item.status, '', 1 );
					} );
					navigate( {
						search: {
							...searchParams,
							responseIds: undefined,
						},
					} );

					const message =
						items.length === 1
							? __( 'Response permanently deleted.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of responses */
									_n(
										'%d response permanently deleted.',
										'%d responses permanently deleted.',
										items.length,
										'jetpack-forms'
									),
									items.length
							  );
					createSuccessNotice( message, { type: 'snackbar' } );

					try {
						await Promise.all(
							items.map( item =>
								deleteEntityRecord(
									'postType',
									'feedback',
									item.id,
									{ force: true },
									{ throwOnError: true }
								)
							)
						);
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
						invalidateCounts();
					} catch {
						// Revert optimistic update
						items.forEach( item => {
							updateCountsOptimistically( '', item.status, 1 );
						} );
						createErrorNotice( __( 'Failed to delete.', 'jetpack-forms' ), {
							type: 'snackbar',
						} );
						invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
					}
				},
			} as ActionWithDestructive< FormResponse >,
		];
	}

	return baseActions;
}
