/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import {
	markAsSpamAction,
	markAsNotSpamAction,
	moveToTrashAction,
	restoreAction,
	deleteAction,
	markAsReadAction,
	markAsUnreadAction,
} from '../../inbox/stage/actions.tsx';
/**
 * Types
 */
import type { FormResponse } from '../../../types/index.ts';
import type { Registry } from '../../inbox/stage/types.tsx';

type ResponseNavigationProps = {
	onActionComplete?: ( response: FormResponse ) => void;
	response: FormResponse;
	variant?: 'icon' | 'text';
};

const ResponseActions = ( {
	onActionComplete,
	response,
	variant = 'icon',
}: ResponseNavigationProps ): JSX.Element => {
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
		await markAsSpamAction.callback( [ response ], { registry } );
		setIsMarkingAsSpam( false );
	}, [ response, registry, onActionComplete ] );

	const handleMarkAsNotSpam = useCallback( async () => {
		onActionComplete?.( response );
		setIsMarkingAsNotSpam( true );
		await markAsNotSpamAction.callback( [ response ], { registry } );
		setIsMarkingAsNotSpam( false );
	}, [ response, registry, onActionComplete ] );

	const handleMoveToTrash = useCallback( async () => {
		onActionComplete?.( response );
		setIsMovingToTrash( true );
		await moveToTrashAction.callback( [ response ], { registry } );
		setIsMovingToTrash( false );
	}, [ response, registry, onActionComplete ] );

	const handleRestore = useCallback( async () => {
		onActionComplete?.( response );
		setIsRestoring( true );
		await restoreAction.callback( [ response ], { registry } );
		setIsRestoring( false );
	}, [ response, registry, onActionComplete ] );

	const handleDelete = useCallback( async () => {
		onActionComplete?.( response );
		setIsDeleting( true );
		await deleteAction.callback( [ response ], { registry } );
		setIsDeleting( false );
	}, [ response, registry, onActionComplete ] );

	const handleMarkAsRead = useCallback( async () => {
		setIsTogglingReadStatus( true );
		await markAsReadAction.callback( [ response ], { registry } );
		setIsTogglingReadStatus( false );
		onActionComplete?.( { ...response, is_unread: false } );
	}, [ response, registry, onActionComplete ] );

	const handleMarkAsUnread = useCallback( async () => {
		setIsTogglingReadStatus( true );
		await markAsUnreadAction.callback( [ response ], { registry } );
		setIsTogglingReadStatus( false );
		onActionComplete?.( { ...response, is_unread: true } );
	}, [ response, registry, onActionComplete ] );

	const isTextVariant = variant === 'text';
	const sharedProps = isTextVariant
		? {
				size: 'compact' as const,
		  }
		: {
				iconSize: 24,
				showTooltip: true,
				size: 'compact' as const,
		  };

	const readUnreadButtons = (
		<>
			{ response.is_unread && (
				<Button
					{ ...sharedProps }
					onClick={ handleMarkAsRead }
					isBusy={ isTogglingReadStatus }
					label={ isTextVariant ? undefined : markAsReadAction.label }
					icon={ isTextVariant ? undefined : markAsReadAction.icon }
				>
					{ isTextVariant && markAsReadAction.label }
				</Button>
			) }
			{ ! response.is_unread && (
				<Button
					{ ...sharedProps }
					onClick={ handleMarkAsUnread }
					isBusy={ isTogglingReadStatus }
					label={ isTextVariant ? undefined : markAsUnreadAction.label }
					icon={ isTextVariant ? undefined : markAsUnreadAction.icon }
				>
					{ isTextVariant && markAsUnreadAction.label }
				</Button>
			) }
		</>
	);

	const containerStyle = isTextVariant
		? {
				display: 'flex',
				gap: '4px',
				alignItems: 'center',
				marginLeft: '-12px', // Compensate for button internal padding
		  }
		: {};

	switch ( response.status ) {
		case 'spam':
			return (
				<div style={ containerStyle }>
					{ readUnreadButtons }
					<Button
						{ ...sharedProps }
						onClick={ handleMarkAsNotSpam }
						isBusy={ isMarkingAsNotSpam }
						label={ isTextVariant ? undefined : markAsNotSpamAction.label }
						icon={ isTextVariant ? undefined : markAsNotSpamAction.icon }
					>
						{ isTextVariant && markAsNotSpamAction.label }
					</Button>
					<Button
						{ ...sharedProps }
						onClick={ handleMoveToTrash }
						isBusy={ isMovingToTrash }
						label={ isTextVariant ? undefined : moveToTrashAction.label }
						icon={ isTextVariant ? undefined : moveToTrashAction.icon }
					>
						{ isTextVariant && moveToTrashAction.label }
					</Button>
				</div>
			);

		case 'trash':
			return (
				<div style={ containerStyle }>
					{ readUnreadButtons }
					<Button
						{ ...sharedProps }
						onClick={ handleRestore }
						isBusy={ isRestoring }
						label={ isTextVariant ? undefined : restoreAction.label }
						icon={ isTextVariant ? undefined : restoreAction.icon }
					>
						{ isTextVariant && restoreAction.label }
					</Button>
					<Button
						{ ...sharedProps }
						onClick={ handleDelete }
						isBusy={ isDeleting }
						label={ isTextVariant ? undefined : deleteAction.label }
						icon={ isTextVariant ? undefined : deleteAction.icon }
					>
						{ isTextVariant && deleteAction.label }
					</Button>
				</div>
			);

		default: // 'publish' (inbox) or any other status
			return (
				<div style={ containerStyle }>
					{ readUnreadButtons }
					<Button
						{ ...sharedProps }
						onClick={ handleMarkAsSpam }
						isBusy={ isMarkingAsSpam }
						label={ isTextVariant ? undefined : markAsSpamAction.label }
						icon={ isTextVariant ? undefined : markAsSpamAction.icon }
					>
						{ isTextVariant && markAsSpamAction.label }
					</Button>
					<Button
						{ ...sharedProps }
						onClick={ handleMoveToTrash }
						isBusy={ isMovingToTrash }
						label={ isTextVariant ? undefined : moveToTrashAction.label }
						icon={ isTextVariant ? undefined : moveToTrashAction.icon }
					>
						{ isTextVariant && moveToTrashAction.label }
					</Button>
				</div>
			);
	}
};

export default ResponseActions;
