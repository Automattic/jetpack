/**
 * Editor-only helpers for jetpack/post-type-filter.
 *
 * Single-mode UX: the block carries one `mode` ('include'|'exclude') plus
 * one `postTypes` slug list, never both lists at once. The editor's
 * algorithmic surface (slug normalization, label disambiguation, preview
 * copy) is unit-tested here; component-level rendering follows the same
 * approach the rest of the package uses (no React-Testing-Library mounts).
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

describe( 'describePreview', () => {
	const labelBySlug = new Map( [
		[ 'post', 'Post' ],
		[ 'page', 'Page' ],
		[ 'product', 'Product' ],
	] );

	it( 'renders the Exclude label and value when mode is exclude', () => {
		expect( describePreview( 'exclude', [ 'product' ], labelBySlug ) ).toEqual( {
			label: 'Exclude:',
			value: 'Product',
		} );
	} );

	it( 'renders the Include label and value when mode is include', () => {
		expect( describePreview( 'include', [ 'post', 'page' ], labelBySlug ) ).toEqual( {
			label: 'Include only:',
			value: 'Post, Page',
		} );
	} );

	it( 'shows "(none selected)" when no post types are configured (Exclude mode)', () => {
		expect( describePreview( 'exclude', [], labelBySlug ) ).toEqual( {
			label: 'Exclude:',
			value: '(none selected)',
		} );
	} );

	it( 'shows "(none selected)" when no post types are configured (Include mode)', () => {
		expect( describePreview( 'include', [], labelBySlug ) ).toEqual( {
			label: 'Include only:',
			value: '(none selected)',
		} );
	} );

	it( 'falls back to the raw slug when the type is not yet loaded', () => {
		// Simulates the brief window where core-data has not resolved
		// `getPostTypes()` yet — the picker shows raw slugs as token
		// titles, and the preview should match.
		expect( describePreview( 'exclude', [ 'unknown-cpt' ], new Map() ) ).toEqual( {
			label: 'Exclude:',
			value: 'unknown-cpt',
		} );
	} );
} );
