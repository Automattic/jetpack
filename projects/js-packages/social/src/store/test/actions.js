/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { refreshTweets, setTweets, setTwitterCards } from '../actions';

describe( 'refreshTweets', () => {
	it( 'returns the REFRESH_TWEETS action type', () => {
		expect( refreshTweets() ).to.deep.equal( {
			type: 'REFRESH_TWEETS',
		} );
	} );
} );

describe( 'setTweets', () => {
	it( 'returns the SET_TWEETS action type', () => {
		const tweets = [ 'foo', 'bar' ];
		expect( setTweets( tweets ) ).to.deep.equal( {
			type: 'SET_TWEETS',
			tweets,
		} );
	} );
} );

describe( 'setTwitterCards', () => {
	it( 'returns the SET_TWITTER_CARDS action type', () => {
		const cards = [ 'foo', 'bar' ];
		expect( setTwitterCards( cards ) ).to.deep.equal( {
			type: 'SET_TWITTER_CARDS',
			cards,
		} );
	} );
} );
