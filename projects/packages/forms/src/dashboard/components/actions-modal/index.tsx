/*
import {
	viewAction,
	viewActionModal,
	markAsSpamAction,
	markAsNotSpamAction,
	moveToTrashAction,
	deleteAction,
	restoreAction,
} from '../inbox/dataviews/actions';
*/
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { markAsSpamAction, moveToTrashAction } from '../../inbox/dataviews/actions';

const ActionsModal = ( { response } ) => {
	const registry = null;

	const markAsSpam = useCallback( item => markAsSpamAction.callback( [ item ], { registry } ), [] );
	const moveToTrash = useCallback(
		item => moveToTrashAction.callback( [ item ], { registry } ),
		[]
	);

	return (
		<>
			{ markAsSpamAction.isEligible( response ) && (
				<Button
					size="compact"
					onClick={ markAsSpam( response ) }
					icon={ markAsSpamAction.icon }
					label={ markAsSpamAction.label }
				/>
			) }
			{ moveToTrashAction.isEligible( response ) && (
				<Button
					size="compact"
					onClick={ moveToTrash( response ) }
					icon={ moveToTrashAction.icon }
					label={ moveToTrashAction.label }
				/>
			) }
		</>
	);
};

export default ActionsModal;
