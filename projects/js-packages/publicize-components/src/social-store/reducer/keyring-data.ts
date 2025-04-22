import {
	CLEAR_KEYRING_REQUESTS,
	FETCHING_KEYRING_RESULT,
	POLLING_FOR_KEYRING_RESULT,
	RECEIVE_KEYRING_RESPONSE,
	SET_KEYRING_RESULT_POLLING_ABORT_CONTROLLER,
} from '../actions/constants';
import {
	clearKeyringRequests,
	fetchingKeryingResult,
	pollingForKeyringResult,
	receiveKeyringResponse,
	setKeyringResultPollingAbortController,
} from '../actions/keyring-data';
import { SocialStoreState } from '../types';

type Action =
	| ReturnType<
			| typeof clearKeyringRequests
			| typeof fetchingKeryingResult
			| typeof pollingForKeyringResult
			| typeof receiveKeyringResponse
			| typeof setKeyringResultPollingAbortController
	  >
	| { type: 'default' };

/**
 * Keyring data reducer
 *
 * @param state  - State object.
 * @param action - Action object.
 *
 * @return - The updated state.
 */
export function keyringData(
	state: SocialStoreState[ 'keyringData' ] = {},
	action: Action
): SocialStoreState[ 'keyringData' ] {
	switch ( action.type ) {
		case FETCHING_KEYRING_RESULT:
			return {
				...state,
				lastRequest: action.requestId,
				requests: {
					...state?.requests,
					[ action.requestId ]: {
						...state?.requests?.[ action.requestId ],
						fetching: action.fetching ?? true,
					},
				},
			};
		case POLLING_FOR_KEYRING_RESULT:
			return {
				...state,
				requests: {
					...state?.requests,
					[ action.requestId ]: {
						...state?.requests?.[ action.requestId ],
						service: action.service ?? state?.requests?.[ action.requestId ]?.service,
						polling: action.polling,
					},
				},
			};
		case RECEIVE_KEYRING_RESPONSE:
			return {
				...state,
				requests: {
					...state?.requests,
					[ action.requestId ]: {
						...state?.requests?.[ action.requestId ],
						response: action.response,
						fetching: false,
					},
				},
			};
		case CLEAR_KEYRING_REQUESTS:
			return {
				...state,
				lastRequest: undefined,
				requests: {},
			};

		case SET_KEYRING_RESULT_POLLING_ABORT_CONTROLLER:
			return {
				...state,
				requests: {
					...state?.requests,
					[ action.requestId ]: {
						...state?.requests?.[ action.requestId ],
						abortController: action.abortController,
					},
				},
			};
	}

	return state;
}
