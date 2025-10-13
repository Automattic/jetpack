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
} from '../../inbox/dataviews/actions';
/**
 * Types
 */
import type { FormResponse } from '../../../types';

type ResponseNavigationProps = {
	onActionComplete?: ( FormResponse ) => void;
	response: FormResponse;
};

const ResponseActions = ( {
	onActionComplete,
	response,
}: ResponseNavigationProps ): JSX.Element => {
	const [ isMarkingAsSpam, setIsMarkingAsSpam ] = useState( false );
	const [ isMarkingAsNotSpam, setIsMarkingAsNotSpam ] = useState( false );
	const [ isMovingToTrash, setIsMovingToTrash ] = useState( false );
	const [ isRestoring, setIsRestoring ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ isTogglingReadStatus, setIsTogglingReadStatus ] = useState( false );

	const registry = useRegistry();

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

	const readUnreadButtons = (
		<>
			{ response.is_unread && (
				<Button
					variant="tertiary"
					onClick={ handleMarkAsRead }
					isBusy={ isTogglingReadStatus }
					showTooltip={ true }
					label={ markAsReadAction.label }
					iconSize={ 24 }
					icon={ markAsReadAction.icon }
					size="compact"
				></Button>
			) }
			{ ! response.is_unread && (
				<Button
					variant="tertiary"
					onClick={ handleMarkAsUnread }
					isBusy={ isTogglingReadStatus }
					showTooltip={ true }
					label={ markAsUnreadAction.label }
					iconSize={ 24 }
					icon={ markAsUnreadAction.icon }
					size="compact"
				></Button>
			) }
		</>
	);

	switch ( response.status ) {
		case 'spam':
			return (
				<div>
					{ readUnreadButtons }
					<Button
						variant="tertiary"
						onClick={ handleMarkAsNotSpam }
						isBusy={ isMarkingAsNotSpam }
						showTooltip={ true }
						label={ markAsNotSpamAction.label }
						iconSize={ 24 }
						icon={ markAsNotSpamAction.icon }
						size="compact"
					></Button>
					<Button
						variant="tertiary"
						onClick={ handleMoveToTrash }
						isBusy={ isMovingToTrash }
						showTooltip={ true }
						label={ moveToTrashAction.label }
						iconSize={ 24 }
						icon={ moveToTrashAction.icon }
						size="compact"
					></Button>
				</div>
			);

		case 'trash':
			return (
				<div>
					{ readUnreadButtons }
					<Button
						variant="tertiary"
						onClick={ handleRestore }
						isBusy={ isRestoring }
						showTooltip={ true }
						label={ restoreAction.label }
						iconSize={ 24 }
						icon={ restoreAction.icon }
						size="compact"
					></Button>
					<Button
						variant="tertiary"
						onClick={ handleDelete }
						showTooltip={ true }
						isBusy={ isDeleting }
						label={ deleteAction.label }
						iconSize={ 24 }
						icon={ deleteAction.icon }
						size="compact"
					></Button>
				</div>
			);

		default: // 'publish' (inbox) or any other status
			return (
				<div>
					{ readUnreadButtons }
					<Button
						variant="tertiary"
						onClick={ handleMarkAsSpam }
						isBusy={ isMarkingAsSpam }
						showTooltip={ true }
						label={ markAsSpamAction.label }
						iconSize={ 24 }
						icon={ markAsSpamAction.icon }
						size="compact"
					></Button>
					<Button
						variant="tertiary"
						onClick={ handleMoveToTrash }
						isBusy={ isMovingToTrash }
						showTooltip={ true }
						label={ moveToTrashAction.label }
						iconSize={ 24 }
						icon={ moveToTrashAction.icon }
						size="compact"
					></Button>
				</div>
			);
	}
};

export default ResponseActions;
