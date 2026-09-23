import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from 'react';
import { getUserConnectionUrl } from '../../helpers/get-user-connection-url';
import { STORE_ID } from '../../state/store';

const { apiRoot, apiNonce } =
	window?.JP_CONNECTION_INITIAL_STATE || getScriptData()?.connection || {};

interface ConnectionStoreDispatch {
	disconnectUserSuccess: () => void;
	setConnectionErrors: ( errors: Record< string, unknown > ) => void;
}

/**
 * Reduce a rejected API request to the text the notice shows; `@automattic/jetpack-api` rejects with an `Error`.
 *
 * @param {unknown} error - The rejection reason.
 * @return {string} The error message.
 */
function toErrorMessage( error: unknown ): string {
	return error instanceof Error ? error.message : String( error );
}

/**
 * Restore connection hook.
 * It will initiate an API request attempting to restore the connection, or reconnect if it cannot be restored.
 * It also exposes `relinkUser`, which replaces only the current user's own broken token.
 *
 * @return {object} - The hook data.
 */
export default function useRestoreConnection() {
	const [ isRestoringConnection, setIsRestoringConnection ] = useState( false );
	const [ restoreConnectionError, setRestoreConnectionError ] = useState< string | null >( null );

	const { disconnectUserSuccess, setConnectionErrors } = useDispatch(
		STORE_ID
	) as ConnectionStoreDispatch;

	const USER_CONNECTION_URL = getUserConnectionUrl();

	/**
	 * Initiate connection restore.
	 *
	 * Kept referentially stable: callers memoize CTA actions on it, and a fresh
	 * function every render would defeat that.
	 *
	 * @param {boolean} autoReconnectUser - If user connection needs to be reestablished, automatically initiate the flow.
	 * @return {Promise<object>} - The API request promise.
	 */
	const restoreConnection = useCallback(
		( autoReconnectUser = true ) => {
			setIsRestoringConnection( true );
			setRestoreConnectionError( null );

			return restApi
				.reconnect()
				.then( ( connectionStatusData: { status: string } ) => {
					// status 'in_progress' means the user needs to re-connect their WP.com account.
					if ( 'in_progress' === connectionStatusData.status ) {
						disconnectUserSuccess();
						setConnectionErrors( {} );
						if ( autoReconnectUser ) {
							window.location.href = USER_CONNECTION_URL;
						}
					} else {
						window.location.reload();
					}

					return connectionStatusData;
				} )
				.catch( ( error: unknown ) => {
					setRestoreConnectionError( toErrorMessage( error ) );
					setIsRestoringConnection( false );

					throw error;
				} );
		},
		[ disconnectUserSuccess, setConnectionErrors, USER_CONNECTION_URL ]
	);

	/**
	 * Replace the current user's broken token: unlink it, then send them to authorize again.
	 *
	 * The authorize redirect treats any stored token as connected, so it must go first.
	 * Failures share `restoreConnectionError` with the restore flow.
	 *
	 * @param {boolean} hasStoredToken - Whether the user still has a local token to unlink.
	 * @return {Promise< unknown >} - The API request promise.
	 */
	const relinkUser = useCallback(
		( hasStoredToken = true ) => {
			setIsRestoringConnection( true );
			setRestoreConnectionError( null );

			const unlink = hasStoredToken ? restApi.unlinkUser() : Promise.resolve();

			return unlink
				.then( () => {
					disconnectUserSuccess();
					setConnectionErrors( {} );
					// Return to the screen the CTA was clicked on, not the My Jetpack default.
					window.location.href = getUserConnectionUrl( { redirect_url: window.location.href } );
				} )
				.catch( ( error: unknown ) => {
					setRestoreConnectionError( toErrorMessage( error ) );
					setIsRestoringConnection( false );

					throw error;
				} );
		},
		[ disconnectUserSuccess, setConnectionErrors ]
	);

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	return { restoreConnection, relinkUser, isRestoringConnection, restoreConnectionError };
}
