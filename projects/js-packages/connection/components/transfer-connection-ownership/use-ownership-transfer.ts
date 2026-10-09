/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import useRestApiInit from '../../hooks/use-rest-api-init';
import type { ConnectionOwnerCandidate } from './types';

/** What `checkStatus` throws: an Error carrying the REST body it could not return. */
interface ApiError {
	message?: string;
	response?: { code?: string; message?: string };
}

/**
 * Turn a failed transfer into something the user can act on.
 *
 * All four are reachable: the list is built when the dialog opens, so a candidate can
 * stop qualifying while it is on screen.
 *
 * The refusal code is on the thrown Error's `response`, not the Error itself: the API
 * client puts the REST body there and keeps `message` for its own "… (Status 400)" text.
 *
 * @param {ApiError} err - The rejection from the API client.
 * @return {string} Message to show.
 */
function transferErrorMessage( err: ApiError ): string {
	const code = err?.response?.code ?? '';
	const message = err?.response?.message ?? err?.message ?? '';

	switch ( code ) {
		case 'ownership_locked':
			return __(
				'Ownership of this connection is locked and cannot be transferred.',
				'jetpack-connection-js'
			);
		case 'new_owner_not_admin':
			return __(
				'That user is no longer an administrator, so they cannot take over the connection.',
				'jetpack-connection-js'
			);
		case 'new_owner_not_connected':
			return __(
				'That user is no longer connected to WordPress.com. Ask them to reconnect, or choose someone else.',
				'jetpack-connection-js'
			);
		case 'new_owner_is_existing_owner':
			return __( 'That user already owns this connection.', 'jetpack-connection-js' );
		default:
			return (
				message ||
				__(
					'The connection owner could not be changed. Please try again.',
					'jetpack-connection-js'
				)
			);
	}
}

/** Where the user is in choose → confirm → done. */
export type TransferStep = 'choose' | 'confirm' | 'done';

export interface UseOwnershipTransferArgs {
	/** API root URL. */
	apiRoot: string;
	/** API nonce. */
	apiNonce: string;
	/** Called as soon as WordPress.com accepts the new owner. */
	onTransferred?: ( newOwnerId: number ) => void;
}

export type { ConnectionOwnerCandidate };

/**
 * Candidate list, selection and the step the user is on.
 *
 * @param {UseOwnershipTransferArgs} args - Hook arguments.
 * @return The candidates, the current selection, and the transfer action.
 */
export default function useOwnershipTransfer( {
	apiRoot,
	apiNonce,
	onTransferred,
}: UseOwnershipTransferArgs ) {
	const [ candidates, setCandidates ] = useState< ConnectionOwnerCandidate[] | null >( null );
	const [ selectedId, setSelectedId ] = useState< number | null >( null );
	const [ isTransferring, setIsTransferring ] = useState( false );
	const [ step, setStep ] = useState< TransferStep >( 'choose' );
	const [ error, setError ] = useState( '' );

	useRestApiInit( apiRoot, apiNonce );

	useEffect( () => {
		let ignore = false;

		restApi
			.fetchConnectionOwnerCandidates()
			.then( ( result: ConnectionOwnerCandidate[] ) => {
				if ( ! ignore ) {
					setCandidates( Array.isArray( result ) ? result : [] );
				}
			} )
			.catch( () => {
				if ( ! ignore ) {
					setCandidates( [] );
					setError(
						__(
							'Could not load the administrators who can take over this connection.',
							'jetpack-connection-js'
						)
					);
				}
			} );

		// The component can close while the request is in flight.
		return () => {
			ignore = true;
		};
	}, [] );

	const confirm = useCallback( () => {
		setError( '' );
		setStep( 'confirm' );
	}, [] );

	const back = useCallback( () => {
		setError( '' );
		setStep( 'choose' );
	}, [] );

	const transfer = useCallback( () => {
		if ( ! selectedId ) {
			return;
		}

		setIsTransferring( true );
		setError( '' );

		restApi
			.setConnectionOwner( selectedId )
			.then( () => {
				setIsTransferring( false );
				setStep( 'done' );
				onTransferred?.( selectedId );
			} )
			.catch( ( err: ApiError ) => {
				setError( transferErrorMessage( err ) );
				setIsTransferring( false );
			} );
	}, [ selectedId, onTransferred ] );

	const selectedCandidate = candidates?.find( c => c.id === selectedId ) ?? null;

	return {
		candidates,
		selectedId,
		setSelectedId,
		selectedCandidate,
		step,
		confirm,
		back,
		transfer,
		isTransferring,
		error,
	};
}
