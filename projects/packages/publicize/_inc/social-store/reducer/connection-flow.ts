import { setKeyringResult, setReconnectingAccount } from '../actions/connection-data';
import { goToPreviousStep, selectPlatform, startConnectionFlow } from '../actions/connection-flow';
import {
	CANCEL_CONNECTION_FLOW,
	GO_TO_PREVIOUS_CONNECTION_FLOW_STEP,
	SELECT_CONNECTION_FLOW_PLATFORM,
	SET_KEYRING_RESULT,
	SET_RECONNECTING_ACCOUNT,
	START_CONNECTION_FLOW,
} from '../actions/constants';
import { CONNECTION_FLOW_INPUT_SERVICES } from '../constants';
import { ConnectionFlowState, ConnectionFlowStep } from '../types';

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
 * The step to return to on back navigation, or `undefined` when there is no
 * back affordance (first step, or past the OAuth boundary).
 *
 * @param state - Current connection-flow state.
 * @return The previous step, or `undefined`.
 */
export function getPreviousStep( state: ConnectionFlowState ): ConnectionFlowStep | undefined {
	switch ( state.step ) {
		case 'platform-input':
			return 'select-platform';
		case 'authorizing':
			// Input services pass through platform-input; the rest come from the picker.
			return needsInput( state.selectedServiceId ) ? 'platform-input' : 'select-platform';
		default:
			// `select-platform` is the first step; `confirm`/`creating` sit past the
			// OAuth boundary and cannot go back.
			return undefined;
	}
}

type Action =
	| ReturnType<
			| typeof startConnectionFlow
			| typeof selectPlatform
			| typeof goToPreviousStep
			| typeof setKeyringResult
			| typeof setReconnectingAccount
	  >
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
				...state,
				selectedServiceId: action.serviceId,
				step: stepForService( action.serviceId ),
			};

		case GO_TO_PREVIOUS_CONNECTION_FLOW_STEP: {
			const previous = getPreviousStep( state );
			return previous ? { ...state, step: previous } : state;
		}

		case SET_RECONNECTING_ACCOUNT:
			// Reconnect is an entry point: jump past platform selection to the
			// connect step for the account's service.
			if ( action.reconnectingAccount ) {
				return {
					...state,
					selectedServiceId: action.reconnectingAccount.service_name,
					step: stepForService( action.reconnectingAccount.service_name ),
				};
			}
			return state;

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
