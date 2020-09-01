/**
 * Internal dependencies
 */
import { refreshTweets, setTweets } from '../actions';

describe( 'refreshTweets', () => {
	it( 'returns the REFRESH_TWEETS action type', () => {
		expect( refreshTweets() ).toEqual( {
			type: 'REFRESH_TWEETS',
		} );
	} );
} );

describe( 'setTweets', () => {
	it( 'returns the SET_TWEETS action type', () => {
		const tweets = [ 'foo', 'bar' ];
		expect( setTweets( tweets ) ).toEqual( {
			type: 'SET_TWEETS',
			tweets,
		} );
	} );
} );
