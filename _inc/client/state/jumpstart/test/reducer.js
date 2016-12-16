import { expect } from 'chai';

import {
	status as statusReducer
} from '../reducer';

const jumpstartState = {
	showJumpStart: {},
	isJumpstarting: false
};

describe( 'status reducer', () => {
	it( 'state should default to empty object', () => {
		const stateOut = statusReducer( undefined, {} );
		expect( stateOut ).to.eql( jumpstartState );
	} );

	describe( '#jumpstartActivation', () => {
		it( 'should set isJumpstarting to true when activating jumpstart', () => {
			const stateIn = {};
			const action = {
				type: 'JUMPSTART_ACTIVATE'
			};
			let stateOut = statusReducer( stateIn, action );
			expect( stateOut.isJumpstarting ).to.be.true;
		} );

		it( 'should set isJumpstarting and showJumpStart to false when jumpstart activation suceeds', () => {
			const stateIn = {};
			const action = {
				type: 'JUMPSTART_ACTIVATE_SUCCESS'
			};
			let stateOut = statusReducer( stateIn, action );
			expect( stateOut.isJumpstarting ).to.be.false;
			expect( stateOut.showJumpStart ).to.be.false;
		} );

		it( 'should set isJumpstarting and showJumpStart to false when jumpstart is skipped', () => {
			const stateIn = {};
			const action = {
				type: 'JUMPSTART_SKIP'
			};
			let stateOut = statusReducer( stateIn, action );
			expect( stateOut.isJumpstarting ).to.be.false;
			expect( stateOut.showJumpStart ).to.be.false;
		} );

		it( 'should set isJumpstarting to false when jumpstart activation fails', () => {
			const stateIn = {};
			const action = {
				type: 'JUMPSTART_ACTIVATE_FAIL'
			};
			let stateOut = statusReducer( stateIn, action );
			expect( stateOut.isJumpstarting ).to.be.false;
		} );
	} );

	describe( '#optionsReset', () => {
		it( 'should set showJumpStart to true when resetting options', () => {
			const stateIn = {};
			const action = {
				type: 'RESET_OPTIONS_SUCCESS'
			};
			let stateOut = statusReducer( stateIn, action );
			expect( stateOut.showJumpStart ).to.be.true;
		} );
	} );
} );
