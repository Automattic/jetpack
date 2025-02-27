import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearchParams } from 'react-router-dom';
import { config } from '..';

/**
 * Custom temporary handler for check-for-spam action based on grunion_check_for_spam.
 *
 * @param {number} offset - Offset for the query.
 * @return {Promise} Promise that resolves once checking for spam has finished.
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
// TODO: should there be a check whether Akismet is enabled?
// TODO: shouldn't we use the Akismet REST API? Can we?
const CheckForSpamButton = () => {
	const [ searchParams ] = useSearchParams();
	const urlStatus = searchParams.get( 'status' );
	const [ isChecking, setIsChecking ] = useState( false );
	const hasInboxResponse = useSelect(
		select =>
			select( coreStore ).getEntityRecords( 'postType', 'feedback', {
				status: 'draft,publish',
				per_page: 1,
				_fields: 'id',
			} ),
		[]
	);
	const onClick = useCallback( async () => {
		setIsChecking( true );
		try {
			await checkForSpam();
		} finally {
			setIsChecking( false );
		}
	}, [ setIsChecking ] );
	if ( urlStatus !== 'inbox' || ! hasInboxResponse?.length ) {
		return null;
	}
	return (
		<Button
			onClick={ onClick }
			accessibleWhenDisabled
			disabled={ isChecking }
			isBusy={ isChecking }
			variant="tertiary"
		>
			{ __( 'Check for spam', 'jetpack-forms' ) }
		</Button>
	);
};

export default CheckForSpamButton;
