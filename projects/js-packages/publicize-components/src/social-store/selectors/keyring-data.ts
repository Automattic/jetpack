import { SocialStoreState } from '../types';

/**
 * Returns the Keyring data from the store.
 *
 * @param state - State object.
 *
 * @return The Keyring data.
 */
export function getKeyringData( state: SocialStoreState ) {
	return state.keyringData;
}

/**
 * Returns the Keyring request from the store.
 *
 * @param state     - State object.
 * @param requestId - The request ID. Defaults to the last request.
 *
 * @return The Keyring request.
 */
export function getKeyringRequest( state: SocialStoreState, requestId?: string ) {
	const keyringData = getKeyringData( state );

	const _requestId = requestId ?? keyringData?.lastRequest;

	return keyringData?.requests?.[ _requestId ];
}

/**
 * Returns the Keyring response from the store.
 *
 * @param state     - State object.
 * @param requestId - The request ID. Defaults to the last request.
 *
 * @return The Keyring response.
 */
export function getKeyringResponse( state: SocialStoreState, requestId?: string ) {
	return getKeyringRequest( state, requestId )?.response;
}

/**
 * Returns the Keyring Result from the store.
 *
 * @param state     - State object.
 * @param requestId - The request ID. Defaults to the last request.
 *
 * @return The Keyring result
 */
export function getKeyringResult( state: SocialStoreState, requestId?: string ) {
	return getKeyringResponse( state, requestId )?.data;
}
