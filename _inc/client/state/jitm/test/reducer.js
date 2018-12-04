import { expect } from 'chai';

import {
	data as dataReducer,
    requests as requestsReducer,
} from '../reducer';

const initialRequestsState = {
	isFetchingJitm: false
};

describe( 'data reducer', () => {
	it( 'data state should default to empty object', () => {
		const state = dataReducer( undefined, {} );
		expect( state ).to.eql( {} );
	} );
} );

describe( 'requests reducer', () => {
	it( 'requests state should default to empty object', () => {
		const state = requestsReducer( undefined, {} );
		expect( state ).to.eql( initialRequestsState );
	} );

	describe( '#fetchJitm', () => {
		it( 'should set isFetchingJitm to true when fetching JITMs', () => {
			const stateIn = {};
			const action = {
				type: 'JITM_FETCH'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.isFetchingJitm ).to.be.true;
		} );

		it( 'should set isFetchingJitm to false when JITM fetch succeeds', () => {
			const stateIn = {};
			const action = {
				type: 'JITM_FETCH_RECEIVE'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.isFetchingJitm ).to.be.false;
		} );

		it( 'should set isFetchingJitm to false when fetching JITMs fails', () => {
			const stateIn = {};
			const action = {
				type: 'JITM_FETCH_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.isFetchingJitm ).to.be.false;
		} );
	} );
} );
