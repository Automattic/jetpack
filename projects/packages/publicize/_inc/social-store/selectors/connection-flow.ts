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
 * Whether the current step has a back affordance.
 *
 * @param state - State object.
 * @return Whether back navigation is available.
 */
export function canGoToPreviousConnectionFlowStep( state: SocialStoreState ) {
	return Boolean( getPreviousStep( state.connectionFlow ?? {} ) );
}
