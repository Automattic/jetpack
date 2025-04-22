import apiFetch from '@wordpress/api-fetch';
import { KeyringResponse } from '../types';
import {
	CLEAR_KEYRING_REQUESTS,
	FETCHING_KEYRING_RESULT,
	POLLING_FOR_KEYRING_RESULT,
	RECEIVE_KEYRING_RESPONSE,
	SET_KEYRING_RESULT_POLLING_ABORT_CONTROLLER,
} from './constants';

/**
 * Returns an action object used in signalling that the keyring result
 * is being fetched.
 *
 * @param requestId - Request ID.
 * @param fetching  - Whether the request is in progress.
 * @return  Action object.
 */
export function fetchingKeryingResult( requestId: string, fetching = true ) {
	return {
		type: FETCHING_KEYRING_RESULT,
		requestId,
		fetching,
	};
}

/**
 * Returns an action object to receive the keyring response.
 *
 * @param response  - Keyring response.
 * @param requestId - Request ID.
 *
 * @return  Action object.
 */
export function receiveKeyringResponse( response: KeyringResponse, requestId: string ) {
	return {
		type: RECEIVE_KEYRING_RESPONSE,
		response,
		requestId,
	};
}

/**
 * Clear all the keyring request.
 *
 * @return An action object.
 */
export function clearKeyringRequests() {
	return {
		type: CLEAR_KEYRING_REQUESTS,
	};
}

/**
 * Default implementation to check if the request is complete.
 *
 * @param {KeyringResponse} response - Keyring response.
 *
 * @return - Whether the request is complete.
 */
export function defaultIsRequestComplete( { code, data }: KeyringResponse ) {
	return data && code === 'success';
}

/**
 * Returns an action object used in signalling that polling for the keyring result
 * is in progress.
 *
 * @param args           - Arguments.
 * @param args.requestId - Request ID.
 * @param args.polling   - Polling status.
 * @param args.service   - Service name.
 * @return Action object.
 */
export function pollingForKeyringResult( args: {
	requestId: string;
	polling?: boolean;
	service?: string;
} ) {
	return {
		type: POLLING_FOR_KEYRING_RESULT,
		requestId: args.requestId,
		polling: args.polling ?? true,
		service: args.service,
	};
}

/**
 * Returns an action object setting the keyring result polling AbortController.
 *
 * @param requestId       - Request ID.
 * @param abortController - abortController.
 *
 * @return Action object.
 */
export function setKeyringResultPollingAbortController(
	requestId: string,
	abortController: AbortController
) {
	return {
		type: SET_KEYRING_RESULT_POLLING_ABORT_CONTROLLER,
		requestId,
		abortController,
	};
}

/**
 * Abort polling for the last keyring result.
 *
 * @return - Function to abort polling.
 */
export function abortPollingForLastKeyringResult() {
	return async function ( { dispatch, select } ) {
		const _requestId = select.getKeyringData()?.lastRequest;

		if ( ! _requestId ) {
			return;
		}

		const abortController = select.getKeyringRequest( _requestId ).abortController;

		if ( abortController ) {
			abortController.abort();
			dispatch( setKeyringResultPollingAbortController( _requestId, undefined ) );
		}
	};
}

type PollForKeyringResultOptions = {
	requestId?: string;
	isRequestComplete?: ( data: KeyringResponse ) => boolean;
	onRequestComplete?: ( data: KeyringResponse ) => void;
	pollingInterval?: number;
	timeout?: number;
	service?: string;
};

const ONE_MINUTE_IN_MS = 60 * 1000;

const POLLING_INTERVAL = 3 * 1000; // milliseconds

/**
 * Poll for the keyring Result.
 *
 * @param {PollForKeyringResultOptions} options - Options.
 *
 * @return - Function to start polling.
 */
export function pollForKeyringResult( {
	isRequestComplete = defaultIsRequestComplete,
	onRequestComplete,
	pollingInterval = POLLING_INTERVAL,
	requestId,
	timeout = ONE_MINUTE_IN_MS * 2,
	service,
}: PollForKeyringResultOptions = {} ) {
	return async function ( { dispatch, select } ) {
		let isTheRequestComplete = false;

		const abortController = new AbortController();

		const signal = AbortSignal.any( [
			// The request can be aborted elsewhere.
			abortController.signal,
			// Abort the request if the timeout is reached.
			AbortSignal.timeout( timeout ),
		] );

		dispatch( setKeyringResultPollingAbortController( requestId, abortController ) );
		dispatch( pollingForKeyringResult( { requestId, service } ) );

		do {
			// Do not fetch if the request is still in progress.
			if ( ! select.getKeyringRequest( requestId ).loading ) {
				try {
					dispatch( fetchingKeryingResult( requestId ) );
					const result = await apiFetch< KeyringResponse >( {
						path: `wpcom/v2/publicize/connections/keyring-result?request_id=${ requestId }`,
						signal,
					} );

					dispatch( receiveKeyringResponse( result, requestId ) );
				} catch {
					dispatch( fetchingKeryingResult( requestId, false ) );
				}
			}

			const keyringResponse = select.getKeyringResponse( requestId );

			isTheRequestComplete = isRequestComplete( keyringResponse || {} );

			if ( isTheRequestComplete ) {
				onRequestComplete?.( keyringResponse );
				break;
			}

			if ( abortController.signal.aborted ) {
				break;
			}

			// Wait for the polling interval.
			await new Promise( resolve => {
				/**
				 * Instead of using setTimeout, we use AbortSignal.any to
				 * wait for either the timeout or the abort signal.
				 *
				 * This allows us to cancel/abort the timeout early if aborted from elsewhere.
				 */
				AbortSignal.any( [ AbortSignal.timeout( pollingInterval ), signal ] ).onabort = resolve;
			} );
		} while ( ! isTheRequestComplete );

		dispatch( pollingForKeyringResult( { requestId, polling: false } ) );
	};
}
