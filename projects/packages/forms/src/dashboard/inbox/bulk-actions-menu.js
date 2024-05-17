/**
 * External dependencies
 */
import { AntiSpamIcon } from '@automattic/jetpack-components';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { config } from '../';
import { doBulkAction } from '../data/responses';
import { STORE_NAME } from '../state';
import { ACTION_TABS, ACTIONS, RESPONSES_FETCH_LIMIT, TABS } from './constants';
import { useFeedbackQuery } from './use-feedback-query';

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

const ActionsMenu = ( { currentView, selectedResponses, setSelectedResponses } ) => {
	const [ checkingForSpam, setCheckingForSpam ] = useState( false );

	const { addTabTotals, fetchResponses, removeResponses, setLoading } = useDispatch( STORE_NAME );
	const { currentPage, query } = useFeedbackQuery();

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
			setSelectedResponses( [] );
			removeResponses( selectedResponses );
			addTabTotals( {
				[ currentView ]: -selectedResponses.length,
				[ ACTION_TABS[ action ] ]: selectedResponses.length,
			} );
			await doBulkAction( selectedResponses, action );

			await fetchResponses(
				{
					...query,
					limit: RESPONSES_FETCH_LIMIT,
					offset: ( currentPage - 1 ) * RESPONSES_FETCH_LIMIT,
				},
				{ append: true }
			);
			setLoading( false );
		} catch ( error ) {
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
					{ __( 'Not spam', 'jetpack-forms' ) }
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
