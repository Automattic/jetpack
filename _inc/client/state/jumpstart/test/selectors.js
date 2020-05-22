import { expect } from 'chai';

import {
	getJumpStartStatus,
	isJumpstarting
} from '../reducer';

let state = {
	jetpack: {
		jumpstart: {
			status: {
				showJumpStart: true
			}
		}
	}
};

describe( 'status selectors', () => {
	describe( '#getJumpStartStatus', () => {
		it( 'should return state.jetpack.jumpstart.status.showJumpStart ', () => {
			const stateIn = state;
			const output = getJumpStartStatus( stateIn );
			expect( output ).to.equal( state.jetpack.jumpstart.status.showJumpStart );
		} );
	} );

	describe( '#isJumpstarting', () => {
		it( 'should return state.jetpack.jumpstart.status.isJumpstarting ', () => {
			const stateIn = state;
			const output = isJumpstarting( stateIn );
			expect( output ).to.equal( state.jetpack.jumpstart.status.isJumpstarting );
		} );
	} );
} )
