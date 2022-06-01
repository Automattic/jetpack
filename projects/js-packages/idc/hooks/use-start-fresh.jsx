import restApi from '@automattic/jetpack-api';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from 'react';
import { STORE_ID } from '../state/store';
import trackAndBumpMCStats from '../tools/tracking';

/**
 * Custom hook to handle the migration action.
 *
 * @param {string} redirectUri - WP-admin URI to redirect user to after reconnecting.
 * @returns {{isStartingFresh: boolean, startFreshCallback: ((function(): void)|*)}} Hook values.
 */
export default redirectUri => {
	const [ isStartingFresh, setIsStartingFresh ] = useState( false );

	const isActionInProgress = useSelect( select => select( STORE_ID ).getIsActionInProgress(), [] );
	const { setIsActionInProgress, setErrorType, clearErrorType } = useDispatch( STORE_ID );

	/**
	 * Initiate the migration.
	 */
	const startFreshCallback = useCallback( () => {
		if ( ! isActionInProgress ) {
			trackAndBumpMCStats( 'start_fresh' );

			setIsActionInProgress( true );
			setIsStartingFresh( true );
			clearErrorType();

			restApi
				.startIDCFresh( redirectUri )
				.then( connectUrl => {
					window.location.href = connectUrl + '&from=idc-notice';
				} )
				.catch( error => {
					setIsActionInProgress( false );
					setIsStartingFresh( false );
					setErrorType( 'start-fresh' );

					throw error;
				} );
		}
	}, [
		setIsStartingFresh,
		isActionInProgress,
		setIsActionInProgress,
		redirectUri,
		setErrorType,
		clearErrorType,
	] );

	return {
		isStartingFresh,
		startFreshCallback,
	};
};
