import { setKeyringResult, setReconnectingAccount } from '../actions/connection-data';
import {
	goToNextStep,
	goToPreviousStep,
	selectPlatform,
	setConnectionFlowError,
	setConnectionFlowInput,
	setConnectionFlowRequestId,
} from '../actions/connection-flow';
import {
	CANCEL_CONNECTION_FLOW,
	FAIL_CONNECTION_FLOW_AUTHORIZATION,
	GO_TO_NEXT_CONNECTION_FLOW_STEP,
	GO_TO_PREVIOUS_CONNECTION_FLOW_STEP,
	SELECT_CONNECTION_FLOW_PLATFORM,
	SET_CONNECTION_FLOW_ERROR,
	SET_CONNECTION_FLOW_INPUT,
	SET_CONNECTION_FLOW_REQUEST_ID,
	SET_KEYRING_RESULT,
	SET_RECONNECTING_ACCOUNT,
	START_CONNECTION_FLOW,
} from '../actions/constants';
import { CONNECTION_FLOW_INPUT_SERVICES } from '../constants';
import { ConnectionFlowOrigin, ConnectionFlowState, ConnectionFlowStep } from '../types';

/**
 * Whether a service requires an input step before authorization.
 *
 * @param serviceId - The service ID.
 * @return Whether the service needs the `platform-input` step.
 */
function needsInput( serviceId?: string ) {
	return Boolean(
		serviceId && ( CONNECTION_FLOW_INPUT_SERVICES as readonly string[] ).includes( serviceId )
	);
}

/**
 * The first connect step for a service: services with custom inputs land on
 * `platform-input`, everything else goes straight to `authorizing`.
 *
 * @param serviceId - The service ID.
 * @return The step to enter after selecting the service.
 */
function stepForService( serviceId?: string ): ConnectionFlowStep {
	return needsInput( serviceId ) ? 'platform-input' : 'authorizing';
}

/**
 * The step to fall back to: where back navigation goes, and where an abandoned
 * authorization drops the user. `undefined` when the flow has no earlier step of
 * its own: the first step, past the OAuth boundary, or a reconnect.
 *
 * @param state - Current connection-flow state.
 * @return The previous step, or `undefined`.
 */
export function getPreviousStep( state: ConnectionFlowState ): ConnectionFlowStep | undefined {
	switch ( state.step ) {
		case 'platform-input':
			return state.isReconnect ? undefined : 'select-platform';
		case 'authorizing':
			// Input services pass through platform-input; the rest come from the picker.
			if ( needsInput( state.selectedServiceId ) ) {
				return 'platform-input';
			}
			return state.isReconnect ? undefined : 'select-platform';
		default:
			// `select-platform` is the first step; `confirm`/`creating` sit past the
			// OAuth boundary and cannot go back.
			return undefined;
	}
}

/**
 * Drops a failure message so it does not outlive the step it was raised on.
 *
 * @param state - Current connection-flow state.
 * @return The state without its error.
 */
function withoutError( state: ConnectionFlowState ): ConnectionFlowState {
	if ( ! state.error ) {
		return state;
	}

	const rest = { ...state };
	delete rest.error;

	return rest;
}

/**
 * The step to advance to, or `undefined` when the current step has no forward
 * transition of its own.
 *
 * @param state - Current connection-flow state.
 * @return The next step, or `undefined`.
 */
export function getNextStep( state: ConnectionFlowState ): ConnectionFlowStep | undefined {
	switch ( state.step ) {
		case 'platform-input':
			return 'authorizing';
		default:
			/* `select-platform` advances by picking a service; from `authorizing`
			   on, the connect popup's result drives the flow. */
			return undefined;
	}
}

type Action =
	| ReturnType<
			| typeof selectPlatform
			| typeof goToPreviousStep
			| typeof goToNextStep
			| typeof setConnectionFlowInput
			| typeof setKeyringResult
			| typeof setReconnectingAccount
	  >
	| ReturnType< typeof setConnectionFlowError | typeof setConnectionFlowRequestId >
	| { type: typeof START_CONNECTION_FLOW; origin: ConnectionFlowOrigin }
	| { type: typeof FAIL_CONNECTION_FLOW_AUTHORIZATION; message?: string }
	| { type: typeof CANCEL_CONNECTION_FLOW }
	| { type: '@@UNKNOWN_ACTION@@' };

/**
 * Connection flow reducer.
 *
 * Owns `step`/`selectedServiceId`/`origin` and derives step transitions from
 * `setKeyringResult` (crossing back over the OAuth boundary → `confirm`) and
 * `setReconnectingAccount` (reconnect entry point → straight to the connect step).
 *
 * @param state  - State object.
 * @param action - Action object.
 *
 * @return The updated state.
 */
export function connectionFlow(
	state: ConnectionFlowState = {},
	action: Action
): ConnectionFlowState {
	switch ( action.type ) {
		case START_CONNECTION_FLOW:
			return {
				origin: action.origin,
				step: 'select-platform',
			};

		case SELECT_CONNECTION_FLOW_PLATFORM:
			return {
				...withoutError( state ),
				selectedServiceId: action.serviceId,
				step: stepForService( action.serviceId ),
			};

		case GO_TO_PREVIOUS_CONNECTION_FLOW_STEP: {
			const previous = getPreviousStep( state );
			// `inputs` is kept, so returning to the step does not mean retyping.
			return previous ? { ...withoutError( state ), step: previous } : state;
		}

		case GO_TO_NEXT_CONNECTION_FLOW_STEP: {
			const next = getNextStep( state );
			return next ? { ...withoutError( state ), step: next } : state;
		}

		case SET_CONNECTION_FLOW_INPUT:
			return {
				...withoutError( state ),
				inputs: { ...state.inputs, [ action.field ]: action.value },
			};

		case SET_CONNECTION_FLOW_REQUEST_ID:
			return { ...state, requestId: action.requestId };

		case SET_CONNECTION_FLOW_ERROR:
			return { ...state, error: action.message };

		case FAIL_CONNECTION_FLOW_AUTHORIZATION: {
			// Never strand the user on `authorizing`.
			const previous = getPreviousStep( state );

			/* The attempt is over, so stop accepting its callbacks: the popup keeps
			   listening past its first abort and fires again on the TTL. */
			return previous
				? { ...state, step: previous, error: action.message, requestId: undefined }
				: state;
		}

		case SET_RECONNECTING_ACCOUNT:
			// Reconnect is an entry point: jump past platform selection to the
			// connect step for the account's service.
			if ( action.reconnectingAccount ) {
				return {
					...state,
					selectedServiceId: action.reconnectingAccount.service_name,
					step: stepForService( action.reconnectingAccount.service_name ),
					isReconnect: true,
				};
			}

			/* Clearing it ends a reconnect, in place or failed. A flow that exists
			   only for that reconnect has nothing left to show. */
			return state.isReconnect ? {} : state;

		case SET_KEYRING_RESULT:
			// The keyring result crossing back marks the OAuth boundary. Only
			// advance while the flow is active so legacy paths that set a result
			// without starting the flow don't trigger it.
			if ( state.step && action.keyringResult?.ID ) {
				return {
					...state,
					step: 'confirm',
				};
			}
			return state;

		case CANCEL_CONNECTION_FLOW:
			return {};
	}

	return state;
}
