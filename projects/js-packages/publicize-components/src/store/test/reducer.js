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

	it( 'sets the twitterCards property when given the SET_TWITTER_CARDS action', () => {
		const cards = [ 'foo', 'bar' ];
		const action = {
			type: 'SET_TWITTER_CARDS',
			cards,
		};
		const expected = {
			...DEFAULT_STATE,
			twitterCards: { ...cards },
		};
		expect( reducer( DEFAULT_STATE, action ) ).toEqual( expected );
	} );

	it( 'marks the passed urls as loading when given the GET_TWITTER_CARDS action', () => {
		const urls = [ 'foo', 'bar' ];
		const action = {
			type: 'GET_TWITTER_CARDS',
			urls,
		};
		const expected = {
			...DEFAULT_STATE,
			twitterCards: {
				foo: { error: 'loading' },
				bar: { error: 'loading' },
			},
		};
		expect( reducer( DEFAULT_STATE, action ) ).toEqual( expected );
	} );

	it( 'marks existing cards as loading when given the GET_TWITTER_CARDS action', () => {
		const startState = {
			...DEFAULT_STATE,
			twitterCards: {
				foo: { title: 'some title' },
			},
		};
		const urls = [ 'foo', 'bar', 'baz' ];
		const action = {
			type: 'GET_TWITTER_CARDS',
			urls,
		};
		const expected = {
			...DEFAULT_STATE,
			twitterCards: {
				foo: { error: 'loading' },
				bar: { error: 'loading' },
				baz: { error: 'loading' },
			},
		};
		expect( reducer( startState, action ) ).toEqual( expected );
	} );
} );
