/**
 * Editor-only helpers for jetpack/post-type-filter.
 *
 * The block's edit component does meaningful work outside the React render —
 * label/slug round-tripping, conflict detection across case-different inputs,
 * disambiguating duplicate post-type labels, and `sanitize_key`-equivalent
 * normalization on save. These tests lock in those contracts so the editor
 * can't drift from what the server normalizer (`Post_Type_Filter::build_lists`)
 * eventually applies on render.
 */
import {
	sanitizeKey,
	disambiguateLabels,
	tokensToSlugs,
	describePreview,
} from '../../../src/search-blocks/blocks/post-type-filter/edit';

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
		// Two CPTs share the singular_name "Portfolio" — without
		// disambiguation, picking either suggestion would always resolve
		// to whichever appears first in the list.
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
		// Without normalization, `Post` (free-typed) and `post` (picked) would
		// both store as distinct entries in the attribute list.
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

describe( 'describePreview', () => {
	const labelBySlug = new Map( [
		[ 'post', 'Post' ],
		[ 'page', 'Page' ],
		[ 'product', 'Product' ],
	] );

	it( 'flags the empty state when neither list has values', () => {
		expect( describePreview( [], [], labelBySlug ) ).toEqual( {
			empty: true,
			includeText: '(any post type)',
			excludeText: '(none)',
		} );
	} );

	it( 'renders Include labels (not raw slugs) and the empty-Exclude fallback', () => {
		expect( describePreview( [ 'post', 'page' ], [], labelBySlug ) ).toEqual( {
			empty: false,
			includeText: 'Post, Page',
			excludeText: '(none)',
		} );
	} );

	it( 'renders Exclude labels and the empty-Include fallback', () => {
		expect( describePreview( [], [ 'product' ], labelBySlug ) ).toEqual( {
			empty: false,
			includeText: '(any post type)',
			excludeText: 'Product',
		} );
	} );

	it( 'renders both label lists when include and exclude are both set', () => {
		expect( describePreview( [ 'post' ], [ 'product' ], labelBySlug ) ).toEqual( {
			empty: false,
			includeText: 'Post',
			excludeText: 'Product',
		} );
	} );

	it( 'falls back to the raw slug when the type is not yet loaded', () => {
		// Simulates the brief window where core-data has not resolved
		// `getPostTypes()` yet — the picker shows raw slugs as token
		// titles, and the preview should match.
		expect( describePreview( [ 'unknown-cpt' ], [], new Map() ) ).toEqual( {
			empty: false,
			includeText: 'unknown-cpt',
			excludeText: '(none)',
		} );
	} );
} );
