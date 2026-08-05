import { globalNoticesStore } from '@automattic/jetpack-components';
import { dispatch as coreDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ConnectionFlowOrigin } from '../types';
import { setKeyringResult, setReconnectingAccount } from './connection-data';
import {
	CANCEL_CONNECTION_FLOW,
	FAIL_CONNECTION_FLOW_AUTHORIZATION,
	GO_TO_NEXT_CONNECTION_FLOW_STEP,
	GO_TO_PREVIOUS_CONNECTION_FLOW_STEP,
	SELECT_CONNECTION_FLOW_PLATFORM,
	SET_CONNECTION_FLOW_ERROR,
	SET_CONNECTION_FLOW_INPUT,
	SET_CONNECTION_FLOW_REQUEST_ID,
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
 * Records the connect request the flow is now waiting on, so callbacks from an
 * abandoned popup can be told apart from the current attempt's.
 *
 * @param requestId - The connect request ID, or nothing to stop accepting any.
 *
 * @return An action object.
 */
export function setConnectionFlowRequestId( requestId?: string ) {
	return {
		type: SET_CONNECTION_FLOW_REQUEST_ID,
		requestId,
	};
}

/**
 * Records why a connect attempt failed, without moving the flow. A popup that
 * never opened leaves the user on the step that asked for it.
 *
 * @param message - Why the attempt failed.
 *
 * @return An action object.
 */
export function setConnectionFlowError( message?: string ) {
	return {
		type: SET_CONNECTION_FLOW_ERROR,
		message,
	};
}

/**
 * Drops out of `authorizing` when an attempt already under way cannot finish,
 * landing on the step the user can retry from.
 *
 * A reconnect enters the flow at `authorizing` and has no earlier step of its
 * own, so it closes the flow and reports outside it instead.
 *
 * @param message - Why the attempt did not complete.
 *
 * @return A thunk.
 */
export function failAuthorization( message?: string ) {
	return function ( { dispatch, select } ) {
		if ( select.getConnectionFlowStep() !== 'authorizing' ) {
			return;
		}

		if ( ! select.getConnectionFlowPreviousStep() ) {
			if ( message ) {
				coreDispatch( globalNoticesStore ).createErrorNotice( message, {
					type: 'snackbar',
					isDismissible: true,
				} );
			}

			/* Leave the reconnect itself alone: its popup can still complete the
			   account in place after the flow has closed. */
			dispatch( closeConnectionFlow() );

			return;
		}

		dispatch( { type: FAIL_CONNECTION_FLOW_AUTHORIZATION, message } );
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
	return failAuthorization(
		__( 'Authorization was cancelled. Please try again.', 'jetpack-publicize-pkg' )
	);
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
 * Closes the flow, leaving the keyring and reconnect state it derives from
 * intact.
 *
 * @return An action object.
 */
export function closeConnectionFlow() {
	return {
		type: CANCEL_CONNECTION_FLOW,
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
		dispatch( closeConnectionFlow() );
	};
}
