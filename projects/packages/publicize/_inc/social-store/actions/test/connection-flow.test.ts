import { abandonAuthorization } from '../connection-flow';
import { GO_TO_PREVIOUS_CONNECTION_FLOW_STEP } from '../constants';
import type { ConnectionFlowStep } from '../../types';

/**
 * Run the thunk against a flow parked on the given step.
 *
 * @param step - The current connection-flow step.
 *
 * @return The actions the thunk dispatched.
 */
function runWithStep( step?: ConnectionFlowStep ) {
	const dispatch = jest.fn();

	abandonAuthorization()( {
		dispatch,
		select: { getConnectionFlowStep: () => step },
	} );

	return dispatch.mock.calls.map( ( [ action ] ) => action );
}

describe( 'abandonAuthorization', () => {
	it( 'steps back while the flow is still authorizing', () => {
		expect( runWithStep( 'authorizing' ) ).toEqual( [
			{ type: GO_TO_PREVIOUS_CONNECTION_FLOW_STEP },
		] );
	} );

	it( 'does nothing once the result has landed', () => {
		// A late abort signal must not drag the user back off the confirmation.
		expect( runWithStep( 'confirm' ) ).toEqual( [] );
	} );

	it( 'does nothing when the user restarted the flow', () => {
		expect( runWithStep( 'platform-input' ) ).toEqual( [] );
	} );

	it( 'does nothing when the flow was cancelled', () => {
		expect( runWithStep( undefined ) ).toEqual( [] );
	} );
} );
