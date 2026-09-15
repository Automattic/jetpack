import { EMPTY_OBJECT } from '../constants';
import { getPreviousStep } from '../reducer/connection-flow';
import { SocialStoreState } from '../types';

/**
 * The current connection-flow step, or `undefined` when the flow is inactive.
 *
 * @param state - State object.
 * @return The current step.
 */
export function getConnectionFlowStep( state: SocialStoreState ) {
	return state.connectionFlow?.step;
}

/**
 * The service selected in the connection flow.
 *
 * @param state - State object.
 * @return The selected service ID.
 */
export function getConnectionFlowSelectedServiceId( state: SocialStoreState ) {
	return state.connectionFlow?.selectedServiceId;
}

/**
 * Where the connection flow was started from.
 *
 * @param state - State object.
 * @return The flow origin.
 */
export function getConnectionFlowOrigin( state: SocialStoreState ) {
	return state.connectionFlow?.origin;
}

/**
 * Whether the connection flow is active (a step is set).
 *
 * @param state - State object.
 * @return Whether the flow is active.
 */
export function isConnectionFlowActive( state: SocialStoreState ) {
	return Boolean( state.connectionFlow?.step );
}

/**
 * The values entered on the connection flow's input step.
 *
 * @param state - State object.
 * @return The entered values, keyed by input name.
 */
export function getConnectionFlowInputs( state: SocialStoreState ): Record< string, string > {
	return state.connectionFlow?.inputs ?? EMPTY_OBJECT;
}

/**
 * Why the last authorization attempt did not complete, if it did not.
 *
 * @param state - State object.
 * @return The message to show inline on the current step.
 */
export function getConnectionFlowError( state: SocialStoreState ) {
	return state.connectionFlow?.error;
}

/**
 * The connect request the flow is waiting on.
 *
 * @param state - State object.
 * @return The request ID, if an attempt is under way.
 */
export function getConnectionFlowRequestId( state: SocialStoreState ) {
	return state.connectionFlow?.requestId;
}

/**
 * The step to fall back to: where the back affordance goes, and where an
 * abandoned or blocked authorization drops the user.
 *
 * @param state - State object.
 * @return The previous step, or `undefined` when the flow has none of its own.
 */
export function getConnectionFlowPreviousStep( state: SocialStoreState ) {
	return getPreviousStep( state.connectionFlow ?? {} );
}

/**
 * Whether the current step has a back affordance. `authorizing` has a step to
 * fall back to but no chevron: the connect popup owns the interaction there, so
 * the design gives that step its close button alone.
 *
 * @param state - State object.
 * @return Whether back navigation is available.
 */
export function canGoToPreviousConnectionFlowStep( state: SocialStoreState ) {
	return (
		'authorizing' !== getConnectionFlowStep( state ) &&
		Boolean( getConnectionFlowPreviousStep( state ) )
	);
}
