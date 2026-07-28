import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useEffect, useState } from 'react';
import useConnection from '../../components/use-connection';

const { apiRoot, apiNonce } =
	window?.JP_CONNECTION_INITIAL_STATE || getScriptData()?.connection || {};

/**
 * Take-over-ownership hook.
 *
 * Lets a non-owner admin become the connection owner when the current owner's
 * connection is broken (the deliberate replacement for the previous accidental
 * ownership claim during a reconnect). A disconnected admin is first routed through
 * the user-connection flow; once they return connected, the takeover CTA re-renders so
 * they can complete the takeover. The operation is idempotent: on a partial failure the
 * notice re-renders with the CTA still present, so clicking again simply retries.
 *
 * @return {object} - `{ takeOverOwnership, isTakingOver, takeOverError }`.
 */
export default function useTakeOverConnection() {
	const [ isTakingOver, setIsTakingOver ] = useState( false );
	const [ takeOverError, setTakeOverError ] = useState< string | null >( null );

	const { isUserConnected, handleConnectUser, userConnectionData } = useConnection( {} );

	const currentUserId = userConnectionData?.currentUser?.id as number | undefined;

	/**
	 * Initiate the ownership takeover.
	 *
	 * @return {Promise<unknown>} - The API request (or user-connection) promise.
	 */
	const takeOverOwnership = () => {
		setTakeOverError( null );

		// A disconnected admin must connect their own WordPress.com account first.
		if ( ! isUserConnected ) {
			return Promise.resolve( handleConnectUser() );
		}

		if ( ! currentUserId ) {
			setTakeOverError( 'missing_user_id' );
			return Promise.reject( new Error( 'missing_user_id' ) );
		}

		setIsTakingOver( true );

		return restApi
			.setConnectionOwner( currentUserId )
			.then( ( response: unknown ) => {
				// Reload so every connection-aware surface reflects the new owner.
				window.location.reload();
				return response;
			} )
			.catch( ( error: unknown ) => {
				const message =
					typeof error === 'string'
						? error
						: ( error as { message?: string } )?.message ?? 'takeover_failed';
				setTakeOverError( message );
				setIsTakingOver( false );

				throw error;
			} );
	};

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	return { takeOverOwnership, isTakingOver, takeOverError };
}
