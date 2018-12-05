import { expect } from 'chai';

import {
	fetchJitm,
    getJitm,
	isFetchingJitm,
} from '../reducer';

let state = {
	jetpack: {
		jitm: {
            data: {
                message: 'Hi'
            },
			requests: {
				isFetchingJitm: true
			}
		}
	}
};

describe( 'status selectors', () => {
	describe( '#getJitm', () => {
		it( 'should return state.jetpack.jitm.data.message', () => {
			const stateIn = state;
			const output = getJitm( stateIn );
			expect( output ).to.equal( state.jetpack.jitm.data.message );
		} );
	} );

	describe( '#isFetchingJitm', () => {
		it( 'should return state.jetpack.jitm.requests.isFetchingJim', () => {
			const stateIn = state;
			const output = isFetchingJitm( stateIn );
			expect( output ).to.equal( state.jetpack.jitm.requests.isFetchingJitm );
		} );
	} );
} )
