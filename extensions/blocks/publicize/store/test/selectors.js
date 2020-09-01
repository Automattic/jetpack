/**
 * Internal dependencies
 */
import { getTweetStorm } from '../selectors';

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
				},
				{
					text: 'Tweet 2',
					media: [],
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
			},
			{
				profileImage: 'https://abs.twimg.com/my_profile_image.png',
				screenName: 'me',
				text: 'Tweet 2',
				media: [],
			},
		];

		const tweets = getTweetStorm( state );

		expect( tweets[0] ).toMatchObject( expected[0] );
		expect( tweets[1] ).toMatchObject( expected[1] );
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
