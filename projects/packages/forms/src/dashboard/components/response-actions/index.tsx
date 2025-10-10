/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	onActionComplete?: ( id: string ) => void;
	onMarkAsRead?: ( id: number | false ) => void;
	response: FormResponse;
	isMobile?: boolean;
};

const ResponseActions = ( {
	onActionComplete,
	onMarkAsRead,
	response,
	isMobile = false,
}: ResponseNavigationProps ): JSX.Element => {
	const [ isMarkingAsSpam, setIsMarkingAsSpam ] = useState( false );
	const [ isMarkingAsNotSpam, setIsMarkingAsNotSpam ] = useState( false );
	const [ isMovingToTrash, setIsMovingToTrash ] = useState( false );
	const [ isRestoring, setIsRestoring ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ isTogglingReadStatus, setIsTogglingReadStatus ] = useState( false );

	const registry = useRegistry();

	const handleMarkAsSpam = useCallback( async () => {
		setIsMarkingAsSpam( true );
		await markAsSpamAction.callback( [ response ], { registry } );
		setIsMarkingAsSpam( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleMarkAsNotSpam = useCallback( async () => {
		setIsMarkingAsNotSpam( true );
		await markAsNotSpamAction.callback( [ response ], { registry } );
		setIsMarkingAsNotSpam( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleMoveToTrash = useCallback( async () => {
		setIsMovingToTrash( true );
		await moveToTrashAction.callback( [ response ], { registry } );
		setIsMovingToTrash( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleRestore = useCallback( async () => {
		setIsRestoring( true );
		await restoreAction.callback( [ response ], { registry } );
		setIsRestoring( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleDelete = useCallback( async () => {
		setIsDeleting( true );
		await deleteAction.callback( [ response ], { registry } );
		setIsDeleting( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleMarkAsRead = useCallback( async () => {
		setIsTogglingReadStatus( true );
		onMarkAsRead?.( response.id );
		await markAsReadAction.callback( [ response ], { registry } );
		setIsTogglingReadStatus( false );
	}, [ response, registry, onMarkAsRead ] );

	const handleMarkAsUnread = useCallback( async () => {
		setIsTogglingReadStatus( true );
		await markAsUnreadAction.callback( [ response ], { registry } );
		setIsTogglingReadStatus( false );
	}, [ response, registry ] );

	const variant = isMobile ? 'secondary' : 'tertiary';

	const readUnreadButtons = (
		<>
			{ response.is_unread && (
				<Button
					variant={ variant }
					onClick={ handleMarkAsRead }
					isBusy={ isTogglingReadStatus }
					showTooltip={ true }
					label={ markAsReadAction.label }
					iconSize={ 24 }
					icon={ markAsReadAction.icon }
					size="compact"
				>
					{ isMobile ? __( 'Read', 'jetpack-forms' ) : null }
				</Button>
			) }
			{ ! response.is_unread && (
				<Button
					variant={ variant }
					onClick={ handleMarkAsUnread }
					isBusy={ isTogglingReadStatus }
					showTooltip={ true }
					label={ markAsUnreadAction.label }
					iconSize={ 24 }
					icon={ markAsUnreadAction.icon }
					size="compact"
				>
					{ isMobile ? __( 'Unread', 'jetpack-forms' ) : null }
				</Button>
			) }
		</>
	);

	let buttons;

	switch ( response.status ) {
		case 'spam':
			buttons = (
				<>
					{ readUnreadButtons }
					<Button
						variant={ variant }
						onClick={ handleMarkAsNotSpam }
						isBusy={ isMarkingAsNotSpam }
						showTooltip={ true }
						label={ markAsNotSpamAction.label }
						iconSize={ 24 }
						icon={ markAsNotSpamAction.icon }
						size="compact"
					>
						{ isMobile ? __( 'Restore', 'jetpack-forms' ) : null }
					</Button>
					<Button
						variant={ variant }
						onClick={ handleMoveToTrash }
						isBusy={ isMovingToTrash }
						showTooltip={ true }
						label={ moveToTrashAction.label }
						iconSize={ 24 }
						icon={ moveToTrashAction.icon }
						size="compact"
					>
						{ isMobile ? __( 'Trash', 'jetpack-forms' ) : null }
					</Button>
				</>
			);
			break;
		case 'trash':
			buttons = (
				<>
					{ readUnreadButtons }
					<Button
						variant={ variant }
						onClick={ handleRestore }
						isBusy={ isRestoring }
						showTooltip={ true }
						label={ restoreAction.label }
						iconSize={ 24 }
						icon={ restoreAction.icon }
						size="compact"
					>
						{ isMobile ? __( 'Restore', 'jetpack-forms' ) : null }
					</Button>
					<Button
						variant={ variant }
						onClick={ handleDelete }
						showTooltip={ true }
						isBusy={ isDeleting }
						label={ deleteAction.label }
						iconSize={ 24 }
						icon={ deleteAction.icon }
						size="compact"
					>
						{ isMobile ? __( 'Delete', 'jetpack-forms' ) : null }
					</Button>
				</>
			);
			break;

		default: // 'publish' (inbox) or any other status
			buttons = (
				<>
					{ readUnreadButtons }
					<Button
						variant={ variant }
						onClick={ handleMarkAsSpam }
						isBusy={ isMarkingAsSpam }
						showTooltip={ true }
						label={ markAsSpamAction.label }
						iconSize={ 24 }
						icon={ markAsSpamAction.icon }
						size="compact"
					>
						{ isMobile ? __( 'Spam', 'jetpack-forms' ) : null }
					</Button>
					<Button
						variant={ variant }
						onClick={ handleMoveToTrash }
						isBusy={ isMovingToTrash }
						showTooltip={ true }
						label={ moveToTrashAction.label }
						iconSize={ 24 }
						icon={ moveToTrashAction.icon }
						size="compact"
					>
						{ isMobile ? __( 'Trash', 'jetpack-forms' ) : null }
					</Button>
				</>
			);
	}

	if ( isMobile ) {
		return <div className="jp-forms-response-actions-mobile">{ buttons }</div>;
	}
	return buttons;
};

export default ResponseActions;
