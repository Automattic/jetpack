/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { getUrl, getPaddingTop, getEmbedUrl, getSearchUrl, getUrlWithId, splitStringAndReturnLastItem } from '../utils';
import { GIPHY_API_KEY } from '../constants';


describe( 'Gif Block utils', () => {
	describe( 'getUrl', () => {
		test( 'returns getSearchUrl where there is no id', () => {
			expect( getUrl( 'bubble tea' ) ).toEqual( `https://api.giphy.com/v1/gifs/search?q=bubble%20tea&api_key=${ GIPHY_API_KEY }&limit=10` );
		} );

		test( 'returns getUrlWithId where there is an id', () => {
			expect( getUrl( 'https://giphy.com/gifs/pineapple_kopf' ) ).toEqual( `https://api.giphy.com/v1/gifs/pineapple_kopf?api_key=${ GIPHY_API_KEY }` );
			expect( getUrl( 'https://i.giphy.com/gifs/banana_gesicht.gif' ) ).toEqual( `https://api.giphy.com/v1/gifs/banana_gesicht?api_key=${ GIPHY_API_KEY }` );
		} );
	} );

	describe( 'getPaddingTop', () => {
		test( 'returns padding as a percentage', () => {
			const item = {
				images: {
					original: {
						height: 10,
						width: 10,
					},
				},
			};
			expect( getPaddingTop( item ) ).toEqual( '100%' );
		} );
	} );

	describe( 'getEmbedUrl', () => {
		test( 'returns embed url property', () => {
			expect( getEmbedUrl( { embed_url: 'fuzz' } ) ).toEqual( 'fuzz' );
		} );

		test( 'returns undefined if no property found', () => {
			expect( getEmbedUrl() ).toBeUndefined();
			expect( getEmbedUrl( {} ) ).toBeUndefined();
		} );
	} );

	describe( 'getSearchUrl', () => {
		test( 'returns giphy url with query parameters', () => {
			expect( getSearchUrl( 'grumpy cat' ) ).toEqual( `https://api.giphy.com/v1/gifs/search?q=grumpy%20cat&api_key=${ GIPHY_API_KEY }&limit=10` );
		} );
	} );

	describe( 'getUrlWithId', () => {
		test( 'returns giphy url with query parameters', () => {
			expect( getUrlWithId( 'grumpy_cat' ) ).toEqual( `https://api.giphy.com/v1/gifs/grumpy_cat?api_key=${ GIPHY_API_KEY }` );
		} );
	} );

	describe( 'splitStringAndReturnLastItem', () => {
		test( 'returns the last item from a split string', () => {
			expect( splitStringAndReturnLastItem( 'the-night-was-dark-and-stormy', '-' ) ).toEqual( 'stormy' );
			expect( splitStringAndReturnLastItem( 'https://thenight.was/dark/and/stormy', '/' ) ).toEqual( 'stormy' );
		} );

		test( 'returns the entire string when no delimiter provided (default String.prototype.split() behaviour)', () => {
			expect( splitStringAndReturnLastItem( 'the-night-was-dark-and-stormy' ) ).toEqual( 'the-night-was-dark-and-stormy' );
		} );

		test( 'returns empty string where there are no arguments', () => {
			expect( splitStringAndReturnLastItem() ).toEqual( '' );
		} );
	} );
} );
