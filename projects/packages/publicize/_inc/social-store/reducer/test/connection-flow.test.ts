import { setKeyringResult, setReconnectingAccount } from '../../actions/connection-data';
import {
	goToNextStep,
	goToPreviousStep,
	selectPlatform,
	setConnectionFlowInput,
} from '../../actions/connection-flow';
import {
	CANCEL_CONNECTION_FLOW,
	FAIL_CONNECTION_FLOW_AUTHORIZATION,
	START_CONNECTION_FLOW,
} from '../../actions/constants';
import { connectionFlow } from '../connection-flow';
import type {
	Connection,
	ConnectionFlowOrigin,
	ConnectionFlowState,
	KeyringResult,
} from '../../types';

const connection = ( service_name: string ): Connection =>
	( { connection_id: '1', service_name } ) as Connection;

const keyringResult = ( ID = 42 ): KeyringResult => ( { ID } ) as KeyringResult;

const CANCEL = { type: CANCEL_CONNECTION_FLOW } as const;

// `startConnectionFlow` warms the connect URLs, so it is a thunk; the reducer
// only ever sees the plain action it dispatches.
const start = ( origin: ConnectionFlowOrigin ) =>
	( { type: START_CONNECTION_FLOW, origin } ) as const;

const fail = ( message: string ) =>
	( { type: FAIL_CONNECTION_FLOW_AUTHORIZATION, message } ) as const;

describe( 'connectionFlow reducer', () => {
	it( 'is inactive by default', () => {
		expect( connectionFlow( undefined, { type: '@@UNKNOWN_ACTION@@' } ) ).toEqual( {} );
	} );

	describe( 'forward transitions', () => {
		it( 'starts at select-platform and records the origin', () => {
			expect( connectionFlow( undefined, start( 'editor' ) ) ).toEqual( {
				step: 'select-platform',
				origin: 'editor',
			} );
		} );

		it( 'restarting clears a stale selection', () => {
			const prior: ConnectionFlowState = {
				step: 'authorizing',
				selectedServiceId: 'facebook',
				origin: 'editor',
			};

			expect( connectionFlow( prior, start( 'dashboard' ) ) ).toEqual( {
				step: 'select-platform',
				origin: 'dashboard',
			} );
		} );

		it( 'selecting an input service advances to platform-input', () => {
			const state = connectionFlow(
				{ step: 'select-platform', origin: 'dashboard' },
				selectPlatform( 'bluesky' )
			);

			expect( state ).toEqual( {
				step: 'platform-input',
				selectedServiceId: 'bluesky',
				origin: 'dashboard',
			} );
		} );

		it( 'selecting a non-input service goes straight to authorizing', () => {
			const state = connectionFlow(
				{ step: 'select-platform', origin: 'dashboard' },
				selectPlatform( 'facebook' )
			);

			expect( state ).toEqual( {
				step: 'authorizing',
				selectedServiceId: 'facebook',
				origin: 'dashboard',
			} );
		} );

		it( 'a keyring result crosses the OAuth boundary to confirm', () => {
			const prior: ConnectionFlowState = { step: 'authorizing', selectedServiceId: 'facebook' };

			expect( connectionFlow( prior, setKeyringResult( keyringResult() ) ).step ).toBe( 'confirm' );
		} );

		it( 'ignores a keyring result when the flow is inactive', () => {
			expect( connectionFlow( {}, setKeyringResult( keyringResult() ) ) ).toEqual( {} );
		} );

		it( 'ignores a cleared keyring result', () => {
			const prior: ConnectionFlowState = { step: 'authorizing', selectedServiceId: 'facebook' };

			expect( connectionFlow( prior, setKeyringResult( undefined ) ) ).toBe( prior );
		} );
	} );

	describe( 'forward step transitions', () => {
		it( 'platform-input advances to authorizing', () => {
			const prior: ConnectionFlowState = { step: 'platform-input', selectedServiceId: 'mastodon' };

			expect( connectionFlow( prior, goToNextStep() ).step ).toBe( 'authorizing' );
		} );

		it( 'steps without a forward transition of their own stay put', () => {
			const prior: ConnectionFlowState = { step: 'select-platform' };

			expect( connectionFlow( prior, goToNextStep() ) ).toBe( prior );
		} );
	} );

	describe( 'inputs', () => {
		it( 'records entered values', () => {
			const prior: ConnectionFlowState = { step: 'platform-input', selectedServiceId: 'bluesky' };

			const state = connectionFlow( prior, setConnectionFlowInput( 'handle', 'me.bsky.social' ) );

			expect( state.inputs ).toEqual( { handle: 'me.bsky.social' } );
		} );

		it( 'survives going back to the picker', () => {
			const prior: ConnectionFlowState = {
				step: 'platform-input',
				selectedServiceId: 'bluesky',
				inputs: { handle: 'me.bsky.social' },
			};

			expect( connectionFlow( prior, goToPreviousStep() ) ).toEqual( {
				...prior,
				step: 'select-platform',
			} );
		} );

		it( 'is cleared when a new flow starts', () => {
			const prior: ConnectionFlowState = {
				step: 'platform-input',
				selectedServiceId: 'bluesky',
				inputs: { handle: 'me.bsky.social' },
			};

			expect( connectionFlow( prior, start( 'dashboard' ) ).inputs ).toBeUndefined();
		} );

		it( 'is cleared on cancel', () => {
			const prior: ConnectionFlowState = {
				step: 'platform-input',
				selectedServiceId: 'bluesky',
				inputs: { handle: 'me.bsky.social' },
			};

			expect( connectionFlow( prior, CANCEL ) ).toEqual( {} );
		} );
	} );

	describe( 'back transitions', () => {
		it( 'platform-input goes back to select-platform', () => {
			const prior: ConnectionFlowState = { step: 'platform-input', selectedServiceId: 'bluesky' };

			expect( connectionFlow( prior, goToPreviousStep() ).step ).toBe( 'select-platform' );
		} );

		it( 'authorizing goes back to platform-input for input services', () => {
			const prior: ConnectionFlowState = { step: 'authorizing', selectedServiceId: 'mastodon' };

			expect( connectionFlow( prior, goToPreviousStep() ).step ).toBe( 'platform-input' );
		} );

		it( 'authorizing goes back to select-platform for non-input services', () => {
			const prior: ConnectionFlowState = { step: 'authorizing', selectedServiceId: 'facebook' };

			expect( connectionFlow( prior, goToPreviousStep() ).step ).toBe( 'select-platform' );
		} );

		it( 'select-platform has no back', () => {
			const prior: ConnectionFlowState = { step: 'select-platform' };

			expect( connectionFlow( prior, goToPreviousStep() ) ).toBe( prior );
		} );

		it( 'confirm has no back across the OAuth boundary', () => {
			const prior: ConnectionFlowState = { step: 'confirm', selectedServiceId: 'facebook' };

			expect( connectionFlow( prior, goToPreviousStep() ) ).toBe( prior );
		} );

		it( 'creating has no back', () => {
			const prior: ConnectionFlowState = { step: 'creating', selectedServiceId: 'facebook' };

			expect( connectionFlow( prior, goToPreviousStep() ) ).toBe( prior );
		} );
	} );

	describe( 'reconnect entry point', () => {
		it( 'jumps straight to platform-input for an input service', () => {
			expect( connectionFlow( {}, setReconnectingAccount( connection( 'bluesky' ) ) ) ).toEqual( {
				step: 'platform-input',
				selectedServiceId: 'bluesky',
				isReconnect: true,
			} );
		} );

		it( 'jumps straight to authorizing for a non-input service', () => {
			expect( connectionFlow( {}, setReconnectingAccount( connection( 'facebook' ) ) ) ).toEqual( {
				step: 'authorizing',
				selectedServiceId: 'facebook',
				isReconnect: true,
			} );
		} );

		it( 'ignores clearing the reconnecting account outside a reconnect', () => {
			const prior: ConnectionFlowState = { step: 'authorizing', selectedServiceId: 'facebook' };

			expect( connectionFlow( prior, setReconnectingAccount( undefined ) ) ).toBe( prior );
		} );

		it( 'ends when the reconnect it exists for is cleared', () => {
			// Reconnecting in place, and failing to open the popup, both clear it;
			// either way there is nothing left for the spinner to wait on.
			const prior: ConnectionFlowState = {
				step: 'authorizing',
				selectedServiceId: 'facebook',
				isReconnect: true,
			};

			expect( connectionFlow( prior, setReconnectingAccount( undefined ) ) ).toEqual( {} );
		} );

		it( 'has nothing behind the step it entered at', () => {
			// Going back would drop the user into a connect flow they never started.
			const prior: ConnectionFlowState = {
				step: 'authorizing',
				selectedServiceId: 'facebook',
				isReconnect: true,
			};

			expect( connectionFlow( prior, goToPreviousStep() ) ).toBe( prior );
		} );

		it( 'still steps back to the input it came through', () => {
			const prior: ConnectionFlowState = {
				step: 'authorizing',
				selectedServiceId: 'mastodon',
				isReconnect: true,
			};

			expect( connectionFlow( prior, goToPreviousStep() ).step ).toBe( 'platform-input' );
		} );
	} );

	describe( 'failed authorization', () => {
		it( 'drops back to the input step with the reason', () => {
			const prior: ConnectionFlowState = { step: 'authorizing', selectedServiceId: 'mastodon' };

			expect( connectionFlow( prior, fail( 'Popup blocked' ) ) ).toEqual( {
				...prior,
				step: 'platform-input',
				error: 'Popup blocked',
			} );
		} );

		it( 'drops back to the picker for a service with no input step', () => {
			const prior: ConnectionFlowState = { step: 'authorizing', selectedServiceId: 'facebook' };

			expect( connectionFlow( prior, fail( 'Popup blocked' ) ).step ).toBe( 'select-platform' );
		} );

		it( 'clears the reason once the user picks a platform again', () => {
			const prior: ConnectionFlowState = { step: 'select-platform', error: 'Popup blocked' };

			expect( connectionFlow( prior, selectPlatform( 'facebook' ) ).error ).toBeUndefined();
		} );

		it( 'clears the reason once the user edits an input', () => {
			const prior: ConnectionFlowState = {
				step: 'platform-input',
				selectedServiceId: 'bluesky',
				error: 'Popup blocked',
			};

			expect(
				connectionFlow( prior, setConnectionFlowInput( 'handle', 'me.bsky.social' ) ).error
			).toBeUndefined();
		} );

		it( 'clears the reason on the way back to the picker', () => {
			const prior: ConnectionFlowState = {
				step: 'platform-input',
				selectedServiceId: 'bluesky',
				error: 'Popup blocked',
			};

			expect( connectionFlow( prior, goToPreviousStep() ).error ).toBeUndefined();
		} );

		it( 'clears the reason on the way forward to authorizing', () => {
			const prior: ConnectionFlowState = {
				step: 'platform-input',
				selectedServiceId: 'bluesky',
				error: 'Popup blocked',
			};

			expect( connectionFlow( prior, goToNextStep() ).error ).toBeUndefined();
		} );
	} );

	describe( 'cancel', () => {
		it( 'resets step, selection and origin', () => {
			const prior: ConnectionFlowState = {
				step: 'confirm',
				selectedServiceId: 'facebook',
				origin: 'editor',
			};

			expect( connectionFlow( prior, CANCEL ) ).toEqual( {} );
		} );
	} );
} );
