import { reducer as searchReducer } from '../reducer';

describe( 'Search reducer', () => {
	describe( 'term property', () => {
		test( 'should get set on the respective event', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SEARCH_TERM',
				term: 'Something',
			};
			const stateOut = searchReducer( stateIn, action );
			expect( stateOut.searchTerm ).toEqual( action.term );
		} );

		test( 'should not change on any other events', () => {
			const stateIn = {
				searchTerm: 'initial state',
			};

			const action = {
				type: 'JETPACK_SOME_EVENT',
				term: 'This should not get in',
			};
			const stateOut = searchReducer( stateIn, action );
			expect( stateOut.searchTerm ).toEqual( stateIn.searchTerm );
		} );
	} );
} );
