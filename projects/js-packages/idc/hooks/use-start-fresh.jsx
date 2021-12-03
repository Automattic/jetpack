/**
 * External dependencies
 */
import { useCallback, useState } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import trackAndBumpMCStats from '../tools/tracking';
import { STORE_ID } from '../state/store';

/**
 * Custom hook to handle the migration action.
 *
 * @param {string} redirectUri - WP-admin URI to redirect user to after reconnecting.
 * @returns {{isStartingFresh: boolean, startFreshCallback: ((function(): void)|*)}} Hook values.
 */
export default redirectUri => {
	const [ isStartingFresh, setIsStartingFresh ] = useState( false );

	const isActionInProgress = useSelect( select => select( STORE_ID ).getIsActionInProgress(), [] );
	const { setIsActionInProgress } = useDispatch( STORE_ID );

	/**
	 * Initiate the migration.
	 */
	const startFreshCallback = useCallback( () => {
		if ( ! isActionInProgress ) {
			trackAndBumpMCStats( 'start_fresh' );

			setIsActionInProgress( true );
			setIsStartingFresh( true );

			restApi
				.startIDCFresh( redirectUri )
				.then( connectUrl => {
					window.location.href = connectUrl + '&from=idc-notice';
				} )
				.catch( error => {
					setIsActionInProgress( false );
					setIsStartingFresh( false );
					throw error;
				} );
		}
	}, [ setIsStartingFresh, isActionInProgress, setIsActionInProgress, redirectUri ] );

	return {
		isStartingFresh,
		startFreshCallback,
	};
};
