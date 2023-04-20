import { AntiSpamIcon } from '@automattic/jetpack-components';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { config } from '../';
import { doBulkAction } from '../data/responses';
import { STORE_NAME } from '../state';
import { ACTIONS, RESPONSES_FETCH_LIMIT, TABS } from './constants';

/**
 * Custom temporary handler for check-for-spam action based on grunion_check_for_spam.
 *
 * @param {number} offset - Offset for the query.
 * @returns {Promise} Promise that resolves once checking for spam has finished.
 */
const checkForSpam = ( offset = 0 ) => {
	const limit = 100;
	const body = new FormData();

	body.append( 'action', 'grunion_recheck_queue' );
	body.append(
		`jetpack_check_feedback_spam_${ config( 'blogId' ) }`,
		config( 'checkForSpamNonce' )
	);
	body.append( 'offset', offset );
	body.append( 'limit', limit );

	return fetch( window.ajaxurl, { method: 'POST', body } )
		.then( response => response.json() )
		.then( data => {
			if ( data.processed < limit ) {
				return;
			}

			return checkForSpam( offset + limit );
		} );
};

const ActionsMenu = ( { currentPage, currentView, selectedResponses, setSelectedResponses } ) => {
	const [ checkingForSpam, setCheckingForSpam ] = useState( false );

	const { fetchResponses, removeResponses, setLoading } = useDispatch( STORE_NAME );
	const query = useSelect( select => select( STORE_NAME ).getResponsesQuery(), [] );

	const handleCheckForSpam = useCallback( () => {
		setCheckingForSpam( true );
		checkForSpam().finally( () => {
			setCheckingForSpam( false );
			fetchResponses( query );
		} );
	}, [ fetchResponses, setCheckingForSpam, query ] );

	const onActionHandler = action => async () => {
		try {
			setLoading( true );
			removeResponses( selectedResponses );
			await doBulkAction( selectedResponses, action );

			setSelectedResponses( [] );
			fetchResponses(
				{
					...query,
					limit: RESPONSES_FETCH_LIMIT,
					offset: ( currentPage - 1 ) * RESPONSES_FETCH_LIMIT,
				},
				{ append: true }
			);
		} finally {
			// Prevent getting stuck in loading state if doBulkAction fails
			setLoading( false );
		}
	};

	return (
		<>
			{ currentView !== TABS.trash && (
				<Button onClick={ onActionHandler( ACTIONS.moveToTrash ) } variant="secondary">
					{ __( 'Move to trash', 'jetpack-forms' ) }
				</Button>
			) }

			{ currentView === TABS.trash && (
				<Button onClick={ onActionHandler( ACTIONS.removeFromTrash ) } variant="secondary">
					{ __( 'Remove from trash', 'jetpack-forms' ) }
				</Button>
			) }

			{ currentView !== TABS.spam && (
				<Button onClick={ onActionHandler( ACTIONS.markAsSpam ) } variant="secondary">
					{ __( 'Mark as spam', 'jetpack-forms' ) }
				</Button>
			) }

			{ currentView === TABS.spam && (
				<Button onClick={ onActionHandler( ACTIONS.markAsNotSpam ) } variant="secondary">
					{ __( 'Remove from spam', 'jetpack-forms' ) }
				</Button>
			) }

			{ currentView === TABS.inbox && selectedResponses.length > 0 && (
				<Button
					className="jp-forms__check-for-spam"
					disabled={ checkingForSpam }
					variant="secondary"
					onClick={ handleCheckForSpam }
				>
					{ checkingForSpam ? <Spinner /> : <AntiSpamIcon /> }
					{ __( 'Check for spam', 'jetpack-forms' ) }
				</Button>
			) }
		</>
	);
};

export default ActionsMenu;
