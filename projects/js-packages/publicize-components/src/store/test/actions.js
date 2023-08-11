import { refreshTweets, setTweets, setTwitterCards } from '../actions';

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

describe( 'setTwitterCards', () => {
	it( 'returns the SET_TWITTER_CARDS action type', () => {
		const cards = [ 'foo', 'bar' ];
		expect( setTwitterCards( cards ) ).toEqual( {
			type: 'SET_TWITTER_CARDS',
			cards,
		} );
	} );
} );
