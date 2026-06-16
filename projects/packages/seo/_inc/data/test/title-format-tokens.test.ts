/**
 * @jest-environment node
 */
import {
	PAGE_TYPES,
	PAGE_TYPE_SUGGESTIONS,
	PAGE_TYPE_TOKENS,
	buildPreview,
	fromDisplay,
	stringToTokens,
	toDisplay,
	tokensToString,
} from '../title-format-tokens';
import type { TitleFormatToken } from '../settings-types';

describe( 'toDisplay', () => {
	it( 'renders a known placeholder token as a bracketed label', () => {
		expect( toDisplay( { type: 'token', value: 'site_name' } ) ).toBe( '[Site name]' );
		expect( toDisplay( { type: 'token', value: 'post_title' } ) ).toBe( '[Post title]' );
	} );

	it( 'renders placeholders for the non-posts page types', () => {
		expect( toDisplay( { type: 'token', value: 'page_title' } ) ).toBe( '[Page title]' );
		expect( toDisplay( { type: 'token', value: 'group_title' } ) ).toBe( '[Tag or category name]' );
		expect( toDisplay( { type: 'token', value: 'archive_title' } ) ).toBe( '[Archive title]' );
		expect( toDisplay( { type: 'token', value: 'date' } ) ).toBe( '[Date]' );
	} );

	it( 'renders a literal string fragment verbatim', () => {
		expect( toDisplay( { type: 'string', value: ' | ' } ) ).toBe( ' | ' );
	} );

	it( 'falls back to the raw value for an unknown token id', () => {
		expect( toDisplay( { type: 'token', value: 'mystery' } ) ).toBe( 'mystery' );
	} );
} );

describe( 'fromDisplay', () => {
	it( 'parses a known bracketed label back into its placeholder token', () => {
		expect( fromDisplay( '[Site name]' ) ).toEqual( { type: 'token', value: 'site_name' } );
		expect( fromDisplay( '[Tagline]' ) ).toEqual( { type: 'token', value: 'tagline' } );
	} );

	it( 'treats an unknown bracketed string as a literal fragment', () => {
		expect( fromDisplay( '[Unknown]' ) ).toEqual( { type: 'string', value: '[Unknown]' } );
	} );

	it( 'treats a plain separator as a literal fragment', () => {
		expect( fromDisplay( ' | ' ) ).toEqual( { type: 'string', value: ' | ' } );
	} );

	it( 'tokenizes a label that is allowed for the page type', () => {
		expect( fromDisplay( '[Post title]', PAGE_TYPE_TOKENS.posts ) ).toEqual( {
			type: 'token',
			value: 'post_title',
		} );
	} );

	it( 'keeps a label that is NOT allowed for the page type as a literal fragment', () => {
		// `post_title` is not a valid token for the front page, so a save must not
		// carry it as a token (the back-end would reject the whole format).
		expect( fromDisplay( '[Post title]', PAGE_TYPE_TOKENS.front_page ) ).toEqual( {
			type: 'string',
			value: '[Post title]',
		} );
	} );
} );

describe( 'round-trip', () => {
	it( 'is stable for a mixed token/string structure', () => {
		const tokens: TitleFormatToken[] = [
			{ type: 'token', value: 'post_title' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'site_name' },
		];
		expect( tokens.map( toDisplay ).map( display => fromDisplay( display ) ) ).toEqual( tokens );
	} );

	it( 'is stable for an archives structure scoped to its allowed tokens', () => {
		const tokens: TitleFormatToken[] = [
			{ type: 'token', value: 'archive_title' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'site_name' },
		];
		expect(
			tokens.map( toDisplay ).map( display => fromDisplay( display, PAGE_TYPE_TOKENS.archives ) )
		).toEqual( tokens );
	} );
} );

describe( 'page-type token maps', () => {
	it( 'mirrors the back-end Jetpack_SEO_Titles::get_allowed_tokens() whitelist', () => {
		expect( PAGE_TYPE_TOKENS ).toEqual( {
			front_page: [ 'site_name', 'tagline' ],
			posts: [ 'site_name', 'tagline', 'post_title' ],
			pages: [ 'site_name', 'tagline', 'page_title' ],
			groups: [ 'site_name', 'tagline', 'group_title' ],
			archives: [ 'site_name', 'tagline', 'date', 'archive_title' ],
		} );
	} );

	it( 'covers every page type the UI renders', () => {
		PAGE_TYPES.forEach( pt => {
			expect( PAGE_TYPE_TOKENS[ pt.id ] ).toBeDefined();
			expect( PAGE_TYPE_SUGGESTIONS[ pt.id ] ).toBeDefined();
		} );
	} );

	it( 'hides the date suggestion for archives but still allows it as a token', () => {
		expect( PAGE_TYPE_SUGGESTIONS.archives ).not.toContain( 'date' );
		expect( PAGE_TYPE_TOKENS.archives ).toContain( 'date' );
	} );
} );

describe( 'buildPreview', () => {
	it( 'swaps placeholders for sample text and passes literal fragments through', () => {
		const tokens: TitleFormatToken[] = [
			{ type: 'token', value: 'post_title' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'site_name' },
		];
		expect( buildPreview( tokens ) ).toBe( 'Hello World | Your site' );
	} );

	it( 'returns an empty string for no tokens', () => {
		expect( buildPreview( [] ) ).toBe( '' );
	} );

	it( 'falls back to the raw value for an unknown token id', () => {
		expect( buildPreview( [ { type: 'token', value: 'mystery' } ] ) ).toBe( 'mystery' );
	} );
} );

describe( 'tokensToString', () => {
	it( 'joins placeholders (as labels) and literal fragments into one string', () => {
		const tokens: TitleFormatToken[] = [
			{ type: 'token', value: 'post_title' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'site_name' },
		];
		expect( tokensToString( tokens ) ).toBe( '[Post title] | [Site name]' );
	} );

	it( 'returns an empty string for no tokens', () => {
		expect( tokensToString( [] ) ).toBe( '' );
	} );
} );

describe( 'stringToTokens', () => {
	it( 'parses bracketed labels into placeholders and keeps text as literals', () => {
		expect( stringToTokens( '[Post title] | [Site name]', PAGE_TYPE_TOKENS.posts ) ).toEqual( [
			{ type: 'token', value: 'post_title' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'site_name' },
		] );
	} );

	it( 'preserves a separator with its surrounding whitespace', () => {
		expect( stringToTokens( '[Site name] — [Tagline]', PAGE_TYPE_TOKENS.front_page ) ).toEqual( [
			{ type: 'token', value: 'site_name' },
			{ type: 'string', value: ' — ' },
			{ type: 'token', value: 'tagline' },
		] );
	} );

	it( 'preserves repeated separators (unlike a token/chip field, which would dedupe)', () => {
		expect(
			stringToTokens( '[Post title] | [Site name] | [Tagline]', PAGE_TYPE_TOKENS.posts )
		).toEqual( [
			{ type: 'token', value: 'post_title' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'site_name' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'tagline' },
		] );
	} );

	it( 'keeps a label not allowed for the page type as a literal fragment', () => {
		expect( stringToTokens( '[Post title]', PAGE_TYPE_TOKENS.front_page ) ).toEqual( [
			{ type: 'string', value: '[Post title]' },
		] );
	} );

	it( 'returns no tokens for an empty string', () => {
		expect( stringToTokens( '' ) ).toEqual( [] );
	} );

	it( 'round-trips with tokensToString', () => {
		const tokens: TitleFormatToken[] = [
			{ type: 'token', value: 'post_title' },
			{ type: 'string', value: ' - ' },
			{ type: 'token', value: 'site_name' },
		];
		expect( stringToTokens( tokensToString( tokens ), PAGE_TYPE_TOKENS.posts ) ).toEqual( tokens );
	} );
} );
