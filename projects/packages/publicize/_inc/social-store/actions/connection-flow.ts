import { ConnectionFlowOrigin } from '../types';
import { setKeyringResult, setReconnectingAccount } from './connection-data';
import {
	CANCEL_CONNECTION_FLOW,
	GO_TO_NEXT_CONNECTION_FLOW_STEP,
	GO_TO_PREVIOUS_CONNECTION_FLOW_STEP,
	SELECT_CONNECTION_FLOW_PLATFORM,
	SET_CONNECTION_FLOW_INPUT,
	START_CONNECTION_FLOW,
} from './constants';

/**
 * Starts the connection flow at the platform picker.
 *
 * @param options        - Options.
 * @param options.origin - Where the flow was started from.
 *
 * @return An action object.
 */
export function startConnectionFlow( { origin }: { origin: ConnectionFlowOrigin } ) {
	return {
		type: START_CONNECTION_FLOW,
		origin,
	};
}

/**
 * Selects a platform and advances to its first connect step.
 *
 * @param serviceId - The selected service ID.
 *
 * @return An action object.
 */
export function selectPlatform( serviceId: string ) {
	return {
		type: SELECT_CONNECTION_FLOW_PLATFORM,
		serviceId,
	};
}

/**
 * Goes back to the previous step. No-op past the OAuth boundary (`confirm`,
 * `creating`) and at the first step.
 *
 * @return An action object.
 */
export function goToPreviousStep() {
	return {
		type: GO_TO_PREVIOUS_CONNECTION_FLOW_STEP,
	};
}

/**
 * Advances to the next step. Past the OAuth boundary the keyring result drives
 * the transition instead.
 *
 * @return An action object.
 */
export function goToNextStep() {
	return {
		type: GO_TO_NEXT_CONNECTION_FLOW_STEP,
	};
}

/**
 * Steps back out of `authorizing` when a connect attempt looks abandoned.
 *
 * The abandonment signal is a window refocus, which also fires for an unrelated
 * tab switch and for a late result, so this is guarded on the flow still being
 * where the attempt left it.
 *
 * @return A thunk.
 */
export function abandonAuthorization() {
	return function ( { dispatch, select } ) {
		if ( select.getConnectionFlowStep() === 'authorizing' ) {
			dispatch( goToPreviousStep() );
		}
	};
}

/**
 * Records a connect input value, so it survives leaving the input step.
 *
 * @param field - The input name.
 * @param value - The value entered.
 *
 * @return An action object.
 */
export function setConnectionFlowInput( field: string, value: string ) {
	return {
		type: SET_CONNECTION_FLOW_INPUT,
		field,
		value,
	};
}

/**
 * Cancels the connection flow, resetting the step and selection along with the
 * keyring/reconnect state that feeds the flow's derived steps.
 *
 * @return A thunk.
 */
export function cancelConnectionFlow() {
	return function ( { dispatch } ) {
		dispatch( setKeyringResult( undefined ) );
		dispatch( setReconnectingAccount( undefined ) );
		dispatch( { type: CANCEL_CONNECTION_FLOW } );
	};
}
