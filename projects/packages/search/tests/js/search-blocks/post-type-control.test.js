/**
 * Post-type scope control helpers.
 *
 * The control's algorithmic surface (slug normalization, label
 * disambiguation, token→slug resolution) is unit-tested here; it's consumed
 * by the `jetpack-search/search-input` block's post-type setting.
 */
import {
	sanitizeKey,
	disambiguateLabels,
	tokensToSlugs,
} from '../../../src/search-blocks/editor/post-type-control';

describe( 'sanitizeKey', () => {
	it( 'lowercases and strips disallowed characters', () => {
		expect( sanitizeKey( 'Post' ) ).toBe( 'post' );
		expect( sanitizeKey( 'My Custom Type' ) ).toBe( 'mycustomtype' );
	} );

	it( 'preserves underscores and hyphens (PHP sanitize_key allows both)', () => {
		expect( sanitizeKey( 'shop_order' ) ).toBe( 'shop_order' );
		expect( sanitizeKey( 'jetpack-portfolio' ) ).toBe( 'jetpack-portfolio' );
	} );

	it( 'returns an empty string for null / undefined / non-string input', () => {
		expect( sanitizeKey( null ) ).toBe( '' );
		expect( sanitizeKey( undefined ) ).toBe( '' );
		expect( sanitizeKey( '' ) ).toBe( '' );
	} );
} );

describe( 'disambiguateLabels', () => {
	it( 'leaves unique labels untouched', () => {
		const opts = [
			{ value: 'post', label: 'Post' },
			{ value: 'page', label: 'Page' },
		];
		expect( disambiguateLabels( opts ) ).toEqual( opts );
	} );

	it( 'appends the slug to every collision so labels round-trip 1:1 to slugs', () => {
		const opts = [
			{ value: 'jetpack-portfolio', label: 'Portfolio' },
			{ value: 'custom-portfolio', label: 'Portfolio' },
			{ value: 'page', label: 'Page' },
		];
		expect( disambiguateLabels( opts ) ).toEqual( [
			{ value: 'jetpack-portfolio', label: 'Portfolio (jetpack-portfolio)' },
			{ value: 'custom-portfolio', label: 'Portfolio (custom-portfolio)' },
			{ value: 'page', label: 'Page' },
		] );
	} );
} );

describe( 'tokensToSlugs', () => {
	const options = [
		{ value: 'post', label: 'Post' },
		{ value: 'page', label: 'Page' },
		{ value: 'jetpack-portfolio', label: 'Portfolio (jetpack-portfolio)' },
	];

	it( 'resolves picked-suggestion labels back to their slugs', () => {
		expect( tokensToSlugs( [ 'Post', 'Portfolio (jetpack-portfolio)' ], options ) ).toEqual( [
			'post',
			'jetpack-portfolio',
		] );
	} );

	it( 'sanitize_key-normalizes free-typed strings', () => {
		expect( tokensToSlugs( [ 'My Custom Type' ], options ) ).toEqual( [ 'mycustomtype' ] );
	} );

	it( 'collapses case-different free-typed values to the same slug', () => {
		expect( tokensToSlugs( [ 'Post', 'post' ], options ) ).toEqual( [ 'post' ] );
	} );

	it( 'accepts the {value, title} object shape we emit from toTokens', () => {
		expect(
			tokensToSlugs(
				[
					{ value: 'post', title: 'Post' },
					{ value: 'page', title: 'Page' },
				],
				options
			)
		).toEqual( [ 'post', 'page' ] );
	} );

	it( 'returns an empty list for null / undefined input', () => {
		expect( tokensToSlugs( null, options ) ).toEqual( [] );
		expect( tokensToSlugs( undefined, options ) ).toEqual( [] );
	} );
} );
