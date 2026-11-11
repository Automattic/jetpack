import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from 'react';
import { getUserConnectionUrl } from '../../helpers/get-user-connection-url';
import { initConnectionStore } from '../../state/store';

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
 *
 * @param {object} [options]             - Hook options.
 * @param {string} [options.redirectUrl] - Where to return after reauthorizing the user. Defaults to My Jetpack (deprecated).
 * @param {string} [options.from]        - The `from` reported to WordPress.com, from `CONNECTION_FROM`. Defaults to 'my-jetpack' (deprecated).
 * @return {object} - The hook data.
 */
export default function useRestoreConnection( {
	redirectUrl,
	from,
}: { redirectUrl?: string; from?: string } = {} ) {
	// Register the connection store lazily and use the returned descriptor so
	// the store can't be dispatched without being initialized first. Idempotent
	// across consumers.
	const connectionStore = initConnectionStore();

	const [ isRestoringConnection, setIsRestoringConnection ] = useState( false );
	const [ restoreConnectionError, setRestoreConnectionError ] = useState< string | null >( null );

	// The store descriptor carries generic action types, so assert to the
	// narrow shape this hook uses (via `unknown`, as the two don't structurally
	// overlap).
	const { disconnectUserSuccess, setConnectionErrors } = useDispatch(
		connectionStore
	) as unknown as ConnectionStoreDispatch;

	/**
	 * Initiate connection restore.
	 *
	 * Kept referentially stable: callers memoize CTA actions on it, and a fresh
	 * function every render would defeat that.
	 *
	 * @param {boolean} autoReconnectUser - If user connection needs to be reestablished, automatically initiate the flow. When false, the caller handles it and the connection store is updated instead.
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
						// A redirect leaves the store alone: clearing the errors would unmount the banner's spinner before the page leaves.
						if ( autoReconnectUser ) {
							// Built here, not on render: many dashboards run this through useConnectionErrorNotice()
							// only to read the error state, and the URL's warning would fire on every one.
							window.location.href = getUserConnectionUrl( { redirect_url: redirectUrl, from } );
						} else {
							disconnectUserSuccess();
							setConnectionErrors( {} );
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
		[ disconnectUserSuccess, setConnectionErrors, redirectUrl, from ]
	);

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	return { restoreConnection, isRestoringConnection, restoreConnectionError };
}
