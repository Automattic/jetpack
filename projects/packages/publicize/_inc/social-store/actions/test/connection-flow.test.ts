import { globalNoticesStore } from '@automattic/jetpack-components';
import { dispatch as coreDispatch } from '@wordpress/data';
import { abandonAuthorization, failAuthorization } from '../connection-flow';
import { CANCEL_CONNECTION_FLOW, FAIL_CONNECTION_FLOW_AUTHORIZATION } from '../constants';
import type { ConnectionFlowStep } from '../../types';

const CANCELLED = 'Authorization was cancelled. Please try again.';

const createErrorNotice = jest.spyOn( coreDispatch( globalNoticesStore ), 'createErrorNotice' );

/**
 * Run the thunk against a flow parked on the given step.
 *
 * @param options              - Options.
 * @param options.step         - The current connection-flow step.
 * @param options.previousStep - The step the flow can fall back to, if any.
 *
 * @return The actions the thunk dispatched, plus the cancel spy.
 */
function run( {
	step,
	previousStep,
}: { step?: ConnectionFlowStep; previousStep?: ConnectionFlowStep } = {} ) {
	const dispatch = Object.assign( jest.fn(), { cancelConnectionFlow: jest.fn() } );

	abandonAuthorization()( {
		dispatch,
		select: {
			getConnectionFlowStep: () => step,
			getConnectionFlowPreviousStep: () => previousStep,
		},
	} );

	return {
		actions: dispatch.mock.calls.map( ( [ action ] ) => action ),
		cancelConnectionFlow: dispatch.cancelConnectionFlow,
	};
}

describe( 'failAuthorization', () => {
	beforeEach( () => {
		createErrorNotice.mockClear();
	} );

	it( 'falls back to the step behind it, carrying the reason', () => {
		expect( run( { step: 'authorizing', previousStep: 'platform-input' } ).actions ).toEqual( [
			{ type: FAIL_CONNECTION_FLOW_AUTHORIZATION, message: CANCELLED },
		] );
	} );

	it( 'closes a flow that has nothing to fall back to, reporting outside it', () => {
		/* A reconnect enters at `authorizing`, so there is no earlier step of its
		   own. Closing leaves the reconnect itself alone, so a late result can
		   still complete the account in place. */
		const { actions } = run( { step: 'authorizing' } );

		expect( actions ).toEqual( [ { type: CANCEL_CONNECTION_FLOW } ] );
		expect( createErrorNotice ).toHaveBeenCalledWith( CANCELLED, expect.anything() );
	} );

	it( 'stays quiet without a message', () => {
		failAuthorization()( {
			dispatch: Object.assign( jest.fn(), { cancelConnectionFlow: jest.fn() } ),
			select: {
				getConnectionFlowStep: () => 'authorizing',
				getConnectionFlowPreviousStep: () => undefined,
			},
		} );

		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'does nothing once the result has landed', () => {
		// A late abort signal must not drag the user back off the confirmation.
		expect( run( { step: 'confirm', previousStep: 'select-platform' } ).actions ).toEqual( [] );
	} );

	it( 'does nothing when the user restarted the flow', () => {
		expect( run( { step: 'platform-input', previousStep: 'select-platform' } ).actions ).toEqual(
			[]
		);
	} );

	it( 'does nothing when the flow was cancelled', () => {
		expect( run().actions ).toEqual( [] );
	} );
} );
