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
import type { Registry } from '../../inbox/dataviews/types';

type ResponseNavigationProps = {
	onActionComplete?: ( response: FormResponse ) => void;
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

	const sharedProps = {
		variant: 'tertiary',
		showTooltip: true,
		size: 'compact',
	};

	const readUnreadButtons = (
		<>
			{ response.is_unread && (
				<Button
					{ ...sharedProps }
					onClick={ handleMarkAsRead }
					isBusy={ isTogglingReadStatus }
					label={ __( 'Mark as read', 'jetpack-forms' ) }
					aria-label={ __( 'Mark as read', 'jetpack-forms' ) }
				>
					{ markAsReadAction.label }
				</Button>
			) }
			{ ! response.is_unread && (
				<Button
					{ ...sharedProps }
					onClick={ handleMarkAsUnread }
					isBusy={ isTogglingReadStatus }
					label={ __( 'Mark as unread', 'jetpack-forms' ) }
					aria-label={ __( 'Mark as unread', 'jetpack-forms' ) }
				>
					{ markAsUnreadAction.label }
				</Button>
			) }
		</>
	);

	switch ( response.status ) {
		case 'spam':
			return (
				<div className="jp-forms__response-actions">
					{ readUnreadButtons }
					<Button
						{ ...sharedProps }
						onClick={ handleMarkAsNotSpam }
						isBusy={ isMarkingAsNotSpam }
						label={ __( 'Mark as not spam', 'jetpack-forms' ) }
						aria-label={ __( 'Mark as not spam', 'jetpack-forms' ) }
					>
						{ markAsNotSpamAction.label }
					</Button>
					<Button
						{ ...sharedProps }
						onClick={ handleMoveToTrash }
						isBusy={ isMovingToTrash }
						label={ __( 'Move to trash', 'jetpack-forms' ) }
						aria-label={ __( 'Move to trash', 'jetpack-forms' ) }
					>
						{ moveToTrashAction.label }
					</Button>
				</div>
			);

		case 'trash':
			return (
				<div className="jp-forms__response-actions">
					{ readUnreadButtons }
					<Button
						{ ...sharedProps }
						onClick={ handleRestore }
						isBusy={ isRestoring }
						label={ __( 'Restore from trash', 'jetpack-forms' ) }
						aria-label={ __( 'Restore from trash', 'jetpack-forms' ) }
					>
						{ restoreAction.label }
					</Button>
					<Button
						{ ...sharedProps }
						onClick={ handleDelete }
						isBusy={ isDeleting }
						label={ __( 'Delete permanently', 'jetpack-forms' ) }
						aria-label={ __( 'Delete permanently', 'jetpack-forms' ) }
					>
						{ deleteAction.label }
					</Button>
				</div>
			);

		default: // 'publish' (inbox) or any other status
			return (
				<div className="jp-forms__response-actions">
					{ readUnreadButtons }
					<Button
						{ ...sharedProps }
						onClick={ handleMarkAsSpam }
						isBusy={ isMarkingAsSpam }
						label={ __( 'Mark as spam', 'jetpack-forms' ) }
						aria-label={ __( 'Mark as spam', 'jetpack-forms' ) }
					>
						{ markAsSpamAction.label }
					</Button>
					<Button
						{ ...sharedProps }
						onClick={ handleMoveToTrash }
						isBusy={ isMovingToTrash }
						label={ __( 'Move to trash', 'jetpack-forms' ) }
						aria-label={ __( 'Move to trash', 'jetpack-forms' ) }
					>
						{ moveToTrashAction.label }
					</Button>
				</div>
			);
	}
};

export default ResponseActions;
