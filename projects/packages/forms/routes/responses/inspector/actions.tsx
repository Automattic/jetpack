/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import * as React from 'react';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../../../src/dashboard/store';
import type { DispatchActions } from '../../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../../src/types/index.ts';

/**
 * Renders the actions for a response.
 *
 * @param props                  - Props used while rendering the actions for a response.
 * @param props.response         - The response to render the actions for.
 * @param props.onActionComplete - Callback fired when an action is completed.
 *
 * @return                       - Element containing the actions for a response.
 */
export function ResponseActions( {
	response,
	onActionComplete,
}: {
	response: FormResponse;
	onActionComplete: ( item: FormResponse ) => void;
} ) {
	const { saveEntityRecord, deleteEntityRecord, editEntityRecord } = useDispatch(
		coreStore
	) as DispatchActions;
	const { updateCountsOptimistically, invalidateCounts } = useDispatch(
		dashboardStore
	) as DispatchActions;
	const [ isLoading ] = useState( false );

	const handleMarkAsSpam = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { status: 'spam' } );
		updateCountsOptimistically( originalStatus, 'spam', 1 );
		onActionComplete( { ...response, status: 'spam' } );

		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'spam',
			} );
			invalidateCounts();
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { status: originalStatus } );
			updateCountsOptimistically( 'spam', originalStatus, 1 );
		}
	}, [
		response,
		saveEntityRecord,
		editEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleMarkAsNotSpam = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { status: 'publish' } );
		updateCountsOptimistically( originalStatus, 'publish', 1 );
		onActionComplete( { ...response, status: 'publish' } );

		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'publish',
			} );
			invalidateCounts();
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { status: originalStatus } );
			updateCountsOptimistically( 'publish', originalStatus, 1 );
		}
	}, [
		response,
		saveEntityRecord,
		editEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleMoveToTrash = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { status: 'trash' } );
		updateCountsOptimistically( originalStatus, 'trash', 1 );
		onActionComplete( { ...response, status: 'trash' } );

		try {
			await deleteEntityRecord( 'postType', 'feedback', response.id );
			invalidateCounts();
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { status: originalStatus } );
			updateCountsOptimistically( 'trash', originalStatus, 1 );
		}
	}, [
		response,
		deleteEntityRecord,
		editEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleRestore = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { status: 'publish' } );
		updateCountsOptimistically( originalStatus, 'publish', 1 );
		onActionComplete( { ...response, status: 'publish' } );

		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'publish',
			} );
			invalidateCounts();
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { status: originalStatus } );
			updateCountsOptimistically( 'publish', originalStatus, 1 );
		}
	}, [
		response,
		saveEntityRecord,
		editEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleDelete = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		updateCountsOptimistically( originalStatus, '', 1 );
		onActionComplete( response );

		try {
			await deleteEntityRecord( 'postType', 'feedback', response.id, { force: true } );
			invalidateCounts();
		} catch {
			// Revert on error
			updateCountsOptimistically( '', originalStatus, 1 );
		}
	}, [
		response,
		deleteEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleToggleRead = useCallback( async () => {
		const newIsUnread = ! response.is_unread;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { is_unread: newIsUnread } );
		onActionComplete( { ...response, is_unread: newIsUnread } );

		try {
			await apiFetch( {
				path: `/wp/v2/feedback/${ response.id }/read`,
				method: 'POST',
				data: { is_unread: newIsUnread },
			} );
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { is_unread: ! newIsUnread } );
		}
	}, [ response, editEntityRecord, onActionComplete ] );

	const containerStyle = {
		display: 'flex',
		gap: '4px',
		alignItems: 'center',
		marginLeft: '-12px', // Compensate for button internal padding
	};

	if ( response.status === 'trash' ) {
		return (
			<div style={ containerStyle }>
				<Button onClick={ handleToggleRead } isBusy={ isLoading } size="compact">
					{ response.is_unread
						? __( 'Mark as read', 'jetpack-forms' )
						: __( 'Mark as unread', 'jetpack-forms' ) }
				</Button>
				<Button onClick={ handleRestore } isBusy={ isLoading } size="compact">
					{ __( 'Restore', 'jetpack-forms' ) }
				</Button>
				<Button onClick={ handleDelete } isBusy={ isLoading } size="compact">
					{ __( 'Delete', 'jetpack-forms' ) }
				</Button>
			</div>
		);
	}

	if ( response.status === 'spam' ) {
		return (
			<div style={ containerStyle }>
				<Button onClick={ handleToggleRead } isBusy={ isLoading } size="compact">
					{ response.is_unread
						? __( 'Mark as read', 'jetpack-forms' )
						: __( 'Mark as unread', 'jetpack-forms' ) }
				</Button>
				<Button onClick={ handleMarkAsNotSpam } isBusy={ isLoading } size="compact">
					{ __( 'Not spam', 'jetpack-forms' ) }
				</Button>
				<Button onClick={ handleMoveToTrash } isBusy={ isLoading } size="compact">
					{ __( 'Trash', 'jetpack-forms' ) }
				</Button>
			</div>
		);
	}

	return (
		<div style={ containerStyle }>
			<Button onClick={ handleToggleRead } isBusy={ isLoading } size="compact">
				{ response.is_unread
					? __( 'Mark as read', 'jetpack-forms' )
					: __( 'Mark as unread', 'jetpack-forms' ) }
			</Button>
			<Button onClick={ handleMarkAsSpam } isBusy={ isLoading } size="compact">
				{ __( 'Spam', 'jetpack-forms' ) }
			</Button>
			<Button onClick={ handleMoveToTrash } isBusy={ isLoading } size="compact">
				{ __( 'Trash', 'jetpack-forms' ) }
			</Button>
		</div>
	);
}
