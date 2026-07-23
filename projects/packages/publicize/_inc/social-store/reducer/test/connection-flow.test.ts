import { setKeyringResult, setReconnectingAccount } from '../../actions/connection-data';
import {
	goToPreviousStep,
	selectPlatform,
	startConnectionFlow,
} from '../../actions/connection-flow';
import { CANCEL_CONNECTION_FLOW } from '../../actions/constants';
import { connectionFlow } from '../connection-flow';
import type { Connection, ConnectionFlowState, KeyringResult } from '../../types';

const connection = ( service_name: string ): Connection =>
	( { connection_id: '1', service_name } ) as Connection;

const keyringResult = ( ID = 42 ): KeyringResult => ( { ID } ) as KeyringResult;

const CANCEL = { type: CANCEL_CONNECTION_FLOW } as const;

describe( 'connectionFlow reducer', () => {
	it( 'is inactive by default', () => {
		expect( connectionFlow( undefined, { type: '@@UNKNOWN_ACTION@@' } ) ).toEqual( {} );
	} );

	describe( 'forward transitions', () => {
		it( 'starts at select-platform and records the origin', () => {
			expect( connectionFlow( undefined, startConnectionFlow( { origin: 'editor' } ) ) ).toEqual( {
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

			expect( connectionFlow( prior, startConnectionFlow( { origin: 'dashboard' } ) ) ).toEqual( {
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
			} );
		} );

		it( 'jumps straight to authorizing for a non-input service', () => {
			expect( connectionFlow( {}, setReconnectingAccount( connection( 'facebook' ) ) ) ).toEqual( {
				step: 'authorizing',
				selectedServiceId: 'facebook',
			} );
		} );

		it( 'ignores clearing the reconnecting account', () => {
			const prior: ConnectionFlowState = { step: 'authorizing', selectedServiceId: 'facebook' };

			expect( connectionFlow( prior, setReconnectingAccount( undefined ) ) ).toBe( prior );
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
