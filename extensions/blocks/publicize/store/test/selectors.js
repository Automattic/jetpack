/**
 * Internal dependencies
 */
import { getTweetStorm, getTweetsForBlock, getTwitterCardForURLs, twitterCardIsCached } from '../selectors';

describe( 'getTweetStorm', () => {
	it( 'returns an empty array when there are no tweets', () => {
		const state = {
			tweets: [],
		};
		expect( getTweetStorm( state ) ).toEqual( [] );
	} );

	it( 'returns tweets filled out with the account details', () => {
		const state = {
			connections: [
				{
					service_name: 'twitter',
					profile_picture: 'https://abs.twimg.com/my_profile_image.png',
					display_name: 'me',
				},
			],
			tweets: [
				{
					text: 'Tweet 1',
					media: [
						{
							url: 'https://foo.com/bar.jpg',
							alt: 'Some picture',
						},
					],
					tweet: '',
				},
				{
					text: 'Tweet 2',
					media: [],
					tweet: '',
				},
				{
					text: 'Tweet 3',
					media: [],
					tweet: 'https://twitter.com/GaryPendergast/status/934003415507546112',
				},
			],
		};
		const expected = [
			{
				profileImage: 'https://abs.twimg.com/my_profile_image.png',
				screenName: 'me',
				text: 'Tweet 1',
				media: [
					{
						url: 'https://foo.com/bar.jpg',
						alt: 'Some picture',
					},
				],
				tweet: '',
			},
			{
				profileImage: 'https://abs.twimg.com/my_profile_image.png',
				screenName: 'me',
				text: 'Tweet 2',
				media: [],
				tweet: '',
			},
			{
				profileImage: 'https://abs.twimg.com/my_profile_image.png',
				screenName: 'me',
				text: 'Tweet 3',
				media: [],
				tweet: 'https://twitter.com/GaryPendergast/status/934003415507546112',
			},
		];

		const tweets = getTweetStorm( state );

		expect( tweets.length ).toEqual( expected.length );

		expect( tweets[0] ).toMatchObject( expected[0] );
		expect( tweets[1] ).toMatchObject( expected[1] );
		expect( tweets[2] ).toMatchObject( expected[2] );
	} );

	it( 'returns the default twitter account details when none is provided.', () => {
		const state = {
			connections: [
				{
					service_name: 'twitter'
				},
			],
			tweets: [
				{
					text: 'Tweet text',
					media: [],
				},
			],
		};
		const expected = {
			name: 'Account Name',
			profileImage: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png',
			screenName: '',
		};

		const tweets = getTweetStorm( state );

		const accountInfo = {
			name: tweets[0].name,
			profileImage: tweets[0].profileImage,
			screenName: tweets[0].screenName,
		};

		expect( accountInfo ).toEqual( expected );
	} );
} );

describe( 'getTweetsForBlock', () => {
	const stateWithTweetsWithBlocks = {
		tweets: [
			{
				blocks: [
					{ clientId: 'uuid-2' },
					{ clientId: 'uuid-3' },
				],
			},
			{
				blocks: [
					{ clientId: 'uuid-4' },
				],
			},
			{
				blocks: [
					{ clientId: 'uuid-4' },
					{ clientId: 'uuid-5' },
				],
			},
		],
	};

	it( 'returns an empty array when there are no tweets', () => {
		const state = {
			tweets: [],
		};
		expect( getTweetsForBlock( state, 'uuid-1' ) ).toEqual( [] );
	} );

	it( 'returns an empty array when no tweet matches', () => {
		expect( getTweetsForBlock( stateWithTweetsWithBlocks, 'uuid-1' ) ).toEqual( [] );
	} );

	it( 'returns a single tweet when one tweet matches', () => {
		expect( getTweetsForBlock( stateWithTweetsWithBlocks, 'uuid-5' ) ).toEqual( stateWithTweetsWithBlocks.tweets.slice( 2, 3 ) );
	} );

	it( 'returns all matching tweets when multiple tweets match', () => {
		expect( getTweetsForBlock( stateWithTweetsWithBlocks, 'uuid-4' ) ).toEqual( stateWithTweetsWithBlocks.tweets.slice( 1, 3 ) );
	} );
} );

describe( 'getTwitterCardForURLs', () => {
	it( 'returns undefined when there are no cards', () => {
		const state = {
			twitterCards: {},
		};
		expect( getTwitterCardForURLs( state, [ 'foo' ] ) ).toEqual( undefined );
	} );

	it( 'returns undefined when no URLs are passed', () => {
		const state = {
			twitterCards: {
				'foo': { title: 'bar' },
			},
		};
		expect( getTwitterCardForURLs( state ) ).toEqual( undefined );
		expect( getTwitterCardForURLs( state, undefined ) ).toEqual( undefined );
		expect( getTwitterCardForURLs( state, [] ) ).toEqual( undefined );
	} );

	it( 'returns undefined when a matching URL is an error', () => {
		const state = {
			twitterCards: {
				'foo': { error: 'loading' },
			},
		};
		expect( getTwitterCardForURLs( state, [ 'foo' ] ) ).toEqual( undefined );
	} );

	it( 'returns the matching card when the URL is found', () => {
		const state = {
			twitterCards: {
				'foo': { title: 'bar' },
			},
		};
		const expected = {
			url: 'foo',
			title: 'bar',
		};
		expect( getTwitterCardForURLs( state, [ 'foo' ] ) ).toEqual( expected );
	} );
} );

describe( 'twitterCardIsCached', () => {
	it( 'returns false when there are no cards', () => {
		const state = {
			twitterCards: {},
		};
		expect( twitterCardIsCached( state, 'foo' ) ).toEqual( false );
	} );

	it( 'returns false when the URL is not found', () => {
		const state = {
			twitterCards: {
				'foo': { title: 'bar' },
			},
		};
		expect( twitterCardIsCached( state, 'bar' ) ).toEqual( false );
	} );

	it( 'returns true when the URL matches a card with an error', () => {
		const state = {
			twitterCards: {
				'foo': { error: 'loading' },
			},
		};
		expect( twitterCardIsCached( state, 'foo' ) ).toEqual( true );
	} );

	it( 'returns true when the URL matches a card that is not an error', () => {
		const state = {
			twitterCards: {
				'foo': { title: 'bar' },
			},
		};
		expect( twitterCardIsCached( state, 'foo' ) ).toEqual( true );
	} );
} );