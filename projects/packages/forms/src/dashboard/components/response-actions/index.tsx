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
} from '../../inbox/dataviews/actions';
/**
 * Types
 */
import type { FormResponse } from '../../../types';

type ResponseNavigationProps = {
	onActionComplete?: ( id: string ) => void;
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

	switch ( response.status ) {
		case 'spam':
			return (
				<>
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
				</>
			);

		case 'trash':
			return (
				<>
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
				</>
			);

		default: // 'publish' (inbox) or any other status
			return (
				<>
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
				</>
			);
	}
};

export default ResponseActions;
