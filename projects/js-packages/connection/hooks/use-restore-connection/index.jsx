import restApi from '@automattic/jetpack-api';
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from 'react';
import { STORE_ID } from '../../state/store';

const { apiRoot, apiNonce } = window?.JP_CONNECTION_INITIAL_STATE
	? window.JP_CONNECTION_INITIAL_STATE
	: {};

/**
 * Restore connection hook.
 * It will initiate an API request attempting to restore the connection, or reconnect if it cannot be restored.
 *
 * @returns {Object} - The hook data.
 */
export default function useRestoreConnection() {
	const [ isRestoringConnection, setIsRestoringConnection ] = useState( false );
	const [ restoreConnectionError, setRestoreConnectionError ] = useState( null );

	const { disconnectUserSuccess } = useDispatch( STORE_ID );

	const USER_CONNECTION_URL = '/wp-admin/admin.php?page=my-jetpack#/connection';

	/**
	 * Initiate connection restore.
	 *
	 * @param {boolean} autoReconnectUser - If user connection needs to be reestablished, automatically initiate the flow.
	 * @returns {Promise<Object>} - The API request promise.
	 */
	const restoreConnection = ( autoReconnectUser = true ) => {
		setIsRestoringConnection( true );
		setRestoreConnectionError( null );

		return restApi
			.reconnect()
			.then( connectionStatusData => {
				// status 'in_progress' means the user needs to re-connect their WP.com account.
				if ( 'in_progress' === connectionStatusData.status ) {
					disconnectUserSuccess();
					if ( autoReconnectUser ) {
						window.location.href = USER_CONNECTION_URL;
					}
				} else {
					window.location.reload();
				}

				return connectionStatusData;
			} )
			.catch( error => {
				setRestoreConnectionError( error );
				setIsRestoringConnection( false );

				return error;
			} );
	};

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	return { restoreConnection, isRestoringConnection, restoreConnectionError };
}
