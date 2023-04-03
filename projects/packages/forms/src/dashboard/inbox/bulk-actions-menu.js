import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { updateResponseStatus } from '../data/responses';
import { STORE_NAME } from '../state';

const ACTIONS = {
	moveToTrash: 'trash',
	removeFromTrash: 'untrash',
	markAsSpam: 'mark_as_spam',
	markAsNotSpam: 'mark_as_not_spam',
	spamCheck: 'spam_check',
};

const VIEWS = {
	inbox: 'inbox',
	spam: 'spam',
	trash: 'trash',
};

const ActionsMenu = ( { currentView, selectedResponses, setSelectedResponses } ) => {
	const { fetchResponses, setLoading } = useDispatch( STORE_NAME );
	const query = useSelect( select => select( STORE_NAME ).getResponsesQuery(), [] );

	const onActionHandler = action => async () => {
		try {
			setLoading( true );
			await updateResponseStatus( selectedResponses, action );
			fetchResponses( query );
			setSelectedResponses( [] );
		} catch {
			//TODO: Implement error handling
		}
	};

	return (
		<>
			{ currentView !== VIEWS.trash && (
				<Button onClick={ onActionHandler( ACTIONS.moveToTrash ) } variant="secondary">
					{ __( 'Move to trash', 'jetpack-forms' ) }
				</Button>
			) }

			{ currentView === VIEWS.trash && (
				<Button onClick={ onActionHandler( ACTIONS.removeFromTrash ) } variant="secondary">
					{ __( 'Remove from trash', 'jetpack-forms' ) }
				</Button>
			) }

			{ currentView !== VIEWS.spam && (
				<Button onClick={ onActionHandler( ACTIONS.markAsSpam ) } variant="secondary">
					{ __( 'Mark as spam', 'jetpack-forms' ) }
				</Button>
			) }

			{ currentView === VIEWS.spam && (
				<Button onClick={ onActionHandler( ACTIONS.markAsNotSpam ) } variant="secondary">
					{ __( 'Remove from spam', 'jetpack-forms' ) }
				</Button>
			) }

			{ /* Hiding this button until we're able to execute the action */ }
			{ /*<Button*/ }
			{ /*	variant="secondary"*/ }
			{ /*>*/ }
			{ /*	<AntiSpamIcon size="22"/>*/ }
			{ /*	{ __( 'Spam check', 'jetpack-forms' ) }*/ }
			{ /*</Button>*/ }
		</>
	);
};

export default ActionsMenu;
