/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch, useNavigate } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import { getActions } from '../actions';
/**
 * Types
 */
import type { Registry } from '../../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../../src/types/index';

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
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();

	const {
		markAsSpamAction,
		markAsNotSpamAction,
		moveToTrashAction,
		restoreAction,
		deleteAction,
		markAsReadAction,
		markAsUnreadAction,
	} = useMemo(
		() =>
			getActions( {
				navigate,
				searchParams,
			} ),
		[ navigate, searchParams ]
	);

	const [ isMarkingAsSpam, setIsMarkingAsSpam ] = useState( false );
	const [ isMarkingAsNotSpam, setIsMarkingAsNotSpam ] = useState( false );
	const [ isMovingToTrash, setIsMovingToTrash ] = useState( false );
	const [ isRestoring, setIsRestoring ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ isTogglingReadStatus, setIsTogglingReadStatus ] = useState( false );

	const registry = useRegistry() as unknown as Registry;

	const handleMarkAsSpam = useCallback( async () => {
		onActionComplete?.( response );
		setIsMarkingAsSpam( true );
		await markAsSpamAction.callback?.( [ response ], { registry } );
		setIsMarkingAsSpam( false );
	}, [ onActionComplete, response, markAsSpamAction, registry ] );

	const handleMarkAsNotSpam = useCallback( async () => {
		onActionComplete?.( response );
		setIsMarkingAsNotSpam( true );
		await markAsNotSpamAction?.callback?.( [ response ], { registry } );
		setIsMarkingAsNotSpam( false );
	}, [ onActionComplete, response, markAsNotSpamAction, registry ] );

	const handleMoveToTrash = useCallback( async () => {
		onActionComplete?.( response );
		setIsMovingToTrash( true );
		await moveToTrashAction?.callback?.( [ response ], { registry } );
		setIsMovingToTrash( false );
	}, [ onActionComplete, response, moveToTrashAction, registry ] );

	const handleRestore = useCallback( async () => {
		onActionComplete?.( response );
		setIsRestoring( true );
		await restoreAction?.callback?.( [ response ], { registry } );
		setIsRestoring( false );
	}, [ onActionComplete, response, restoreAction, registry ] );

	const handleDelete = useCallback( async () => {
		onActionComplete?.( response );
		setIsDeleting( true );
		await deleteAction?.callback?.( [ response ], { registry } );
		setIsDeleting( false );
	}, [ onActionComplete, response, deleteAction, registry ] );

	const handleMarkAsRead = useCallback( async () => {
		setIsTogglingReadStatus( true );
		await markAsReadAction?.callback?.( [ response ], { registry } );
		setIsTogglingReadStatus( false );
		onActionComplete?.( { ...response, is_unread: false } );
	}, [ onActionComplete, response, markAsReadAction, registry ] );

	const handleMarkAsUnread = useCallback( async () => {
		setIsTogglingReadStatus( true );
		await markAsUnreadAction?.callback?.( [ response ], { registry } );
		setIsTogglingReadStatus( false );
		onActionComplete?.( { ...response, is_unread: true } );
	}, [ onActionComplete, response, markAsUnreadAction, registry ] );

	const sharedProps = useMemo(
		() => ( {
			size: 'compact' as const,
		} ),
		[]
	);

	const readUnreadButtons = (
		<>
			{ response.is_unread && (
				<Button onClick={ handleMarkAsRead } { ...sharedProps } isBusy={ isTogglingReadStatus }>
					{ __( 'Mark as read', 'jetpack-forms' ) }
				</Button>
			) }
			{ ! response.is_unread && (
				<Button onClick={ handleMarkAsUnread } { ...sharedProps } isBusy={ isTogglingReadStatus }>
					{ __( 'Mark as unread', 'jetpack-forms' ) }
				</Button>
			) }
		</>
	);

	const trashButton = (
		<Button onClick={ handleMoveToTrash } { ...sharedProps } isBusy={ isMovingToTrash }>
			{ __( 'Trash', 'jetpack-forms' ) }
		</Button>
	);

	const spamButton = (
		<Button onClick={ handleMarkAsSpam } { ...sharedProps } isBusy={ isMarkingAsSpam }>
			{ __( 'Spam', 'jetpack-forms' ) }
		</Button>
	);

	const notSpamButton = (
		<Button onClick={ handleMarkAsNotSpam } { ...sharedProps } isBusy={ isMarkingAsNotSpam }>
			{ __( 'Not spam', 'jetpack-forms' ) }
		</Button>
	);

	const deleteButton = (
		<Button onClick={ handleDelete } { ...sharedProps } isBusy={ isDeleting }>
			{ __( 'Delete', 'jetpack-forms' ) }
		</Button>
	);

	const restoreButton = (
		<Button onClick={ handleRestore } { ...sharedProps } isBusy={ isRestoring }>
			{ __( 'Restore', 'jetpack-forms' ) }
		</Button>
	);

	return (
		<Stack
			direction="row"
			gap="xs"
			justify="start"
			wrap="wrap"
			className="jp-forms-response-header-actions"
		>
			{ response.status === 'publish' && (
				<>
					{ readUnreadButtons }
					{ spamButton }
					{ trashButton }
				</>
			) }
			{ response.status === 'trash' && (
				<>
					{ readUnreadButtons }
					{ restoreButton }
					{ deleteButton }
				</>
			) }
			{ response.status === 'spam' && (
				<>
					{ readUnreadButtons }
					{ notSpamButton }
					{ trashButton }
				</>
			) }
		</Stack>
	);
}
