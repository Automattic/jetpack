import testEmbedUrl from '../../../shared/test-embed-url';
import { GIPHY_API_KEY } from '../constants';
import {
	getUrl,
	getPaddingTop,
	getEmbedUrl,
	getSearchUrl,
	getUrlWithId,
	splitStringAndReturnLastItem,
	getSelectedGiphyAttributes,
} from '../utils';

jest.mock( '../../../shared/test-embed-url', () => ( {
	__esModule: true,
	default: jest.fn( () => {
		return new Promise( resolve => {
			resolve(
				'https://giphy.com/gifs/wordpressdotcom-diversity-wordpress-radiate-jTqfCm1C0BV5fFAYvT'
			);
		} );
	} ),
} ) );

describe( 'Gif Block utils', () => {
	const GIPHY_ITEM = {
		embed_url: 'fuzz',
		images: {
			original: {
				height: 10,
				width: 10,
			},
		},
	};

	describe( 'getUrl', () => {
		test( 'returns getSearchUrl where there is no id', async () => {
			await expect( getUrl( 'bubble tea' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/search?q=bubble%20tea&api_key=${ GIPHY_API_KEY }&limit=10`
			);
		} );
		test( 'returns trimmed getSearchUrl where there is no id', async () => {
			await expect( getUrl( ' bubble bath  ' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/search?q=bubble%20bath&api_key=${ GIPHY_API_KEY }&limit=10`
			);
		} );

		test( 'returns getUrlWithId where there is an expected http URL with an id', async () => {
			await expect( getUrl( 'http://giphy.com/embed/tomatenAugen7777aSSSS' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/tomatenAugen7777aSSSS?api_key=${ GIPHY_API_KEY }`
			);
			await expect( getUrl( 'http://giphy.com/gifs/pineapple-kopf-ddddd123' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/ddddd123?api_key=${ GIPHY_API_KEY }`
			);
			await expect( getUrl( 'http://i.giphy.com/bananaGesicht999999999.gif' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/bananaGesicht999999999?api_key=${ GIPHY_API_KEY }`
			);
			await expect(
				getUrl( 'http://media.giphy.com/media/blaubeerenAugen000/giphy.gif' )
			).resolves.toBe(
				`https://api.giphy.com/v1/gifs/blaubeerenAugen000?api_key=${ GIPHY_API_KEY }`
			);
		} );

		test( 'returns getUrlWithId where there is an expected https URL with an id', async () => {
			await expect( getUrl( 'https://giphy.com/embed/tomatenAugen7777aSSSS' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/tomatenAugen7777aSSSS?api_key=${ GIPHY_API_KEY }`
			);
			await expect( getUrl( 'https://giphy.com/gifs/pineapple-kopf-ddddd123' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/ddddd123?api_key=${ GIPHY_API_KEY }`
			);
			await expect( getUrl( 'https://i.giphy.com/bananaGesicht999999999.gif' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/bananaGesicht999999999?api_key=${ GIPHY_API_KEY }`
			);
			await expect(
				getUrl( 'https://media.giphy.com/media/blaubeerenAugen000/giphy.gif' )
			).resolves.toBe(
				`https://api.giphy.com/v1/gifs/blaubeerenAugen000?api_key=${ GIPHY_API_KEY }`
			);
		} );

		test( 'returns getUrlWithId when there is a shortlink', async () => {
			const shortlink = 'https://gph.is/g/aKnlLW3';

			const result = await testEmbedUrl( shortlink );

			await getUrl( shortlink );

			expect( testEmbedUrl ).toHaveBeenCalledWith( shortlink );

			expect( result ).toBe(
				'https://giphy.com/gifs/wordpressdotcom-diversity-wordpress-radiate-jTqfCm1C0BV5fFAYvT'
			);
		} );

		test( 'treats searchText as a query string for other URL-like non-matches', async () => {
			await expect( getUrl( 'https://this.does.not/work' ) ).resolves.toBe(
				`https://api.giphy.com/v1/gifs/search?q=https%3A%2F%2Fthis.does.not%2Fwork&api_key=${ GIPHY_API_KEY }&limit=10`
			);
		} );
	} );

	describe( 'getPaddingTop', () => {
		test( 'returns padding as a percentage', () => {
			expect( getPaddingTop( GIPHY_ITEM ) ).toBe( '100%' );
		} );
	} );

	describe( 'getEmbedUrl', () => {
		test( 'returns embed url property', () => {
			expect( getEmbedUrl( GIPHY_ITEM ) ).toEqual( GIPHY_ITEM.embed_url );
		} );

		test( 'returns undefined if no property found', () => {
			expect( getEmbedUrl() ).toBeUndefined();
			expect( getEmbedUrl( {} ) ).toBeUndefined();
		} );
	} );

	describe( 'getSearchUrl', () => {
		test( 'returns giphy url with query parameters', () => {
			expect( getSearchUrl( 'grumpy cat' ) ).toBe(
				`https://api.giphy.com/v1/gifs/search?q=grumpy%20cat&api_key=${ GIPHY_API_KEY }&limit=10`
			);
		} );
	} );

	describe( 'getUrlWithId', () => {
		test( 'returns giphy url with query parameters', () => {
			expect( getUrlWithId( 'grumpy_cat' ) ).toBe(
				`https://api.giphy.com/v1/gifs/grumpy_cat?api_key=${ GIPHY_API_KEY }`
			);
		} );
	} );

	describe( 'splitStringAndReturnLastItem', () => {
		test( 'returns the last item from a split string', () => {
			expect( splitStringAndReturnLastItem( 'the-night-was-dark-and-stormy', '-' ) ).toBe(
				'stormy'
			);
			expect( splitStringAndReturnLastItem( 'https://thenight.was/dark/and/stormy', '/' ) ).toBe(
				'stormy'
			);
		} );

		test( 'returns the entire string when no delimiter provided (default String.prototype.split() behaviour)', () => {
			expect( splitStringAndReturnLastItem( 'the-night-was-dark-and-stormy' ) ).toBe(
				'the-night-was-dark-and-stormy'
			);
			expect( splitStringAndReturnLastItem( 'ID1WITHOUT9STUFF' ) ).toBe( 'ID1WITHOUT9STUFF' );
		} );

		test( 'returns empty string where there are no arguments', () => {
			expect( splitStringAndReturnLastItem() ).toBe( '' );
		} );
	} );

	describe( 'getSelectedGiphyAttributes', () => {
		test( 'returns expected object', () => {
			expect( getSelectedGiphyAttributes( GIPHY_ITEM ) ).toStrictEqual( {
				giphyUrl: getEmbedUrl( GIPHY_ITEM ),
				paddingTop: getPaddingTop( GIPHY_ITEM ),
			} );
		} );
	} );
} );
