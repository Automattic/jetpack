/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CONNECTION_EVENTS, trackConnectionEvent } from '../../helpers/connection-tracking.ts';
import useRestApiInit from '../../hooks/use-rest-api-init';
import { STORE_ID } from '../../state/store';
import type { ConnectionOwnerCandidate } from './types';

/** What `checkStatus` throws: an Error carrying the REST body it could not return. */
interface ApiError {
	message?: string;
	response?: { code?: string; message?: string };
}

/** The refusals the transfer endpoint documents; `transferErrorMessage` has copy for each. */
const KNOWN_REFUSALS = [
	'ownership_locked',
	'new_owner_not_admin',
	'new_owner_not_connected',
	'new_owner_is_existing_owner',
] as const;

type KnownRefusal = ( typeof KNOWN_REFUSALS )[ number ];

/**
 * Whether a REST error code is one of the documented transfer refusals.
 *
 * @param {string} code - The REST error code.
 * @return {boolean} True for a known refusal.
 */
function isKnownRefusal( code: string ): code is KnownRefusal {
	return ( KNOWN_REFUSALS as readonly string[] ).includes( code );
}

/**
 * Read a rejection from the API client as an ApiError, or an empty one when it is not an object.
 *
 * @param {unknown} err - The rejection from the API client.
 * @return {ApiError} The error, safe to read optional fields from.
 */
function toApiError( err: unknown ): ApiError {
	return err && typeof err === 'object' ? ( err as ApiError ) : {};
}

/**
 * The refusal code on a failed transfer, or '' when there is none.
 *
 * @param {unknown} err - The rejection from the API client.
 * @return {string} The REST error code.
 */
function getRefusalCode( err: unknown ): string {
	return toApiError( err ).response?.code ?? '';
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
 * @param {unknown} err - The rejection from the API client.
 * @return {string} Message to show.
 */
function transferErrorMessage( err: unknown ): string {
	const apiError = toApiError( err );
	const code = getRefusalCode( apiError );
	const message = apiError.response?.message ?? apiError.message ?? '';

	// Keep the cases in step with KNOWN_REFUSALS, which Tracks reports by the same codes.
	switch ( isKnownRefusal( code ) ? code : null ) {
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
	/** Surface to report Tracks events as. Sent as null when omitted. */
	trackingContext?: string;
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
	trackingContext,
}: UseOwnershipTransferArgs ) {
	const [ candidates, setCandidates ] = useState< ConnectionOwnerCandidate[] | null >( null );
	const [ selectedId, setSelectedId ] = useState< number | null >( null );
	const [ isTransferring, setIsTransferring ] = useState( false );
	const [ step, setStep ] = useState< TransferStep >( 'choose' );
	const [ error, setError ] = useState( '' );
	const { setConnectionOwner } = useDispatch( STORE_ID );
	const isMounted = useRef( true );

	useRestApiInit( apiRoot, apiNonce );

	useEffect( () => {
		isMounted.current = true;

		return () => {
			isMounted.current = false;
		};
	}, [] );

	useEffect( () => {
		let ignore = false;

		restApi
			.fetchConnectionOwnerCandidates()
			.then( ( result: unknown ) => {
				if ( ignore ) {
					return;
				}

				const list = Array.isArray( result ) ? ( result as ConnectionOwnerCandidate[] ) : [];

				setCandidates( list );

				// Nothing to choose between, so choose it.
				if ( 1 === list.length ) {
					setSelectedId( list[ 0 ].id );
				}
			} )
			.catch( () => {
				if ( ! ignore ) {
					trackConnectionEvent( CONNECTION_EVENTS.ownerTransferError, trackingContext, {
						reason: 'candidates_load_failed',
					} );
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
		// Fetch once on mount; the tracking context is not a reason to refetch.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const confirm = useCallback( () => {
		setError( '' );
		setStep( 'confirm' );
	}, [] );

	const back = useCallback( () => {
		setError( '' );
		setStep( 'choose' );
	}, [] );

	const selectedCandidate = candidates?.find( c => c.id === selectedId ) ?? null;

	const transfer = useCallback( () => {
		if ( ! selectedCandidate ) {
			return;
		}

		const { id, displayName } = selectedCandidate;

		setIsTransferring( true );
		setError( '' );
		trackConnectionEvent( CONNECTION_EVENTS.ownerTransferAttempt, trackingContext );

		restApi
			.setConnectionOwner( id )
			.then( () => {
				// Tell the store who owns the connection now, so every surface reading it
				// stops describing an owner the user no longer is.
				setConnectionOwner( { id, displayName } );
				trackConnectionEvent( CONNECTION_EVENTS.ownerTransferSuccess, trackingContext );

				if ( ! isMounted.current ) {
					return;
				}

				setIsTransferring( false );
				setStep( 'done' );
				onTransferred?.( id );
			} )
			.catch( ( err: unknown ) => {
				const code = getRefusalCode( err );
				trackConnectionEvent( CONNECTION_EVENTS.ownerTransferError, trackingContext, {
					reason: isKnownRefusal( code ) ? code : 'unknown',
				} );

				if ( ! isMounted.current ) {
					return;
				}

				setError( transferErrorMessage( err ) );
				setIsTransferring( false );
			} );
	}, [ selectedCandidate, onTransferred, setConnectionOwner, trackingContext ] );

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
