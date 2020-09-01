/**
 * Internal dependencies
 */
import reducer, { DEFAULT_STATE } from '../reducer';

describe( 'reducer', () => {
	it( 'returns the DEFAULT_STATE when an invalid action is passed', () => {
		expect( reducer( DEFAULT_STATE, { type: 'INVALID_ACTION_TYPE' } ) ).toEqual( DEFAULT_STATE );
	} );

	it( 'returns the DEFAULT_STATE when undefined state is passed', () => {
		expect( reducer( undefined, { type: 'INVALID_ACTION_TYPE' } ) ).toEqual( DEFAULT_STATE );
	} );

	it( 'sets the tweets property when given the SET_TWEETS action', () => {
		const tweets = [ 'foo', 'bar' ];
		const action = {
			type: 'SET_TWEETS',
			tweets,
		};
		const expected = {
			...DEFAULT_STATE,
			tweets,
		};
		expect( reducer( DEFAULT_STATE, action ) ).toEqual( expected );
	} );
} );
