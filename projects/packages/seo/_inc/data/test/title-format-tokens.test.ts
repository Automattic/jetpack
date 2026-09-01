/**
 * @jest-environment node
 */
import {
	PAGE_TYPES,
	PAGE_TYPE_SUGGESTIONS,
	PAGE_TYPE_TOKENS,
	buildDefaultPreview,
	buildDefaultPreviewParts,
	buildPreview,
	buildPreviewParts,
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

// Mirrors how `wp_get_document_title()` composes a title when Jetpack has no
// stored format for the page type and steps aside.
describe( 'buildDefaultPreview', () => {
	const overrides = { site_name: 'Acme Co', tagline: 'We make things' };

	it( 'pairs the site title with the tagline on the front page', () => {
		expect( buildDefaultPreview( 'front_page', '-', overrides ) ).toBe(
			'Acme Co - We make things'
		);
	} );

	it( 'pairs the page-specific title with the site title everywhere else', () => {
		expect( buildDefaultPreview( 'posts', '-', overrides ) ).toBe( 'Hello World - Acme Co' );
		expect( buildDefaultPreview( 'pages', '-', overrides ) ).toBe( 'Sample Page - Acme Co' );
		expect( buildDefaultPreview( 'groups', '-', overrides ) ).toBe( 'News - Acme Co' );
		expect( buildDefaultPreview( 'archives', '-', overrides ) ).toBe( 'Sample Archive - Acme Co' );
	} );

	it( 'uses the separator the site reports, since themes override it', () => {
		expect( buildDefaultPreview( 'posts', '|', overrides ) ).toBe( 'Hello World | Acme Co' );
		expect( buildDefaultPreview( 'posts', '–', overrides ) ).toBe( 'Hello World – Acme Co' );
	} );

	// Core runs `array_filter()` over the parts, so a missing one drops out rather
	// than leaving a dangling separator.
	it( 'omits an empty part instead of leaving a trailing separator', () => {
		expect( buildDefaultPreview( 'front_page', '-', { site_name: 'Acme Co', tagline: '' } ) ).toBe(
			'Acme Co'
		);
	} );

	it( 'falls back to sample text when no real values are supplied', () => {
		expect( buildDefaultPreview( 'posts', '-' ) ).toBe( 'Hello World - Your site' );
	} );

	it( 'returns an empty string for an unknown page type', () => {
		expect( buildDefaultPreview( 'nonsense', '-', overrides ) ).toBe( '' );
	} );

	it( 'covers every page type the UI renders a row for', () => {
		PAGE_TYPES.forEach( ( { id } ) => {
			expect( buildDefaultPreview( id, '-', overrides ) ).not.toBe( '' );
		} );
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

	it( 'uses real override values for tokens when provided', () => {
		const tokens: TitleFormatToken[] = [
			{ type: 'token', value: 'site_name' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'tagline' },
		];
		expect( buildPreview( tokens, { site_name: 'Acme Co', tagline: 'We make things' } ) ).toBe(
			'Acme Co | We make things'
		);
	} );

	const siteNameAndTagline: TitleFormatToken[] = [
		{ type: 'token', value: 'site_name' },
		{ type: 'string', value: ' | ' },
		{ type: 'token', value: 'tagline' },
	];

	it( 'falls back to sample text when the site supplies no override at all', () => {
		expect( buildPreview( siteNameAndTagline, { site_name: 'Acme Co' } ) ).toBe(
			'Acme Co | Your tagline'
		);
	} );

	// A site with no tagline really does render nothing there, and
	// `Jetpack_SEO_Titles::get_custom_title()` concatenates the format straight
	// through — so the separator is left dangling exactly as previewed.
	it( 'renders a supplied-but-empty override as empty, keeping the separator', () => {
		expect( buildPreview( siteNameAndTagline, { site_name: 'Acme Co', tagline: '' } ) ).toBe(
			'Acme Co | '
		);
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

describe( 'preview parts', () => {
	it( 'labels resolved values and typed separators differently', () => {
		expect(
			buildPreviewParts(
				[
					{ type: 'token', value: 'site_name' },
					{ type: 'string', value: ' | ' },
					{ type: 'token', value: 'tagline' },
				],
				{ site_name: 'Acme Co', tagline: 'We make things' }
			)
		).toEqual( [
			{ kind: 'value', text: 'Acme Co' },
			{ kind: 'literal', text: ' | ' },
			{ kind: 'value', text: 'We make things' },
		] );
	} );

	it( 'keeps an empty value as a part, so its separators still show', () => {
		// The real title concatenates straight through, leaving the separator
		// dangling. Dropping the part here would make the preview tidier than the
		// output — the exact dishonesty this preview exists to avoid.
		expect(
			buildPreviewParts(
				[
					{ type: 'token', value: 'site_name' },
					{ type: 'string', value: ' - ' },
					{ type: 'token', value: 'tagline' },
				],
				{ site_name: 'Acme Co', tagline: '' }
			)
		).toEqual( [
			{ kind: 'value', text: 'Acme Co' },
			{ kind: 'literal', text: ' - ' },
			{ kind: 'value', text: '' },
		] );
	} );

	it( 'puts default-title separators between values only', () => {
		// A site with no tagline keeps just its name, and must not trail a separator
		// core would never emit.
		expect(
			buildDefaultPreviewParts( 'front_page', '-', { site_name: 'Acme Co', tagline: '' } )
		).toEqual( [ { kind: 'value', text: 'Acme Co' } ] );

		expect(
			buildDefaultPreviewParts( 'front_page', '-', {
				site_name: 'Acme Co',
				tagline: 'We make things',
			} )
		).toEqual( [
			{ kind: 'value', text: 'Acme Co' },
			{ kind: 'literal', text: ' - ' },
			{ kind: 'value', text: 'We make things' },
		] );
	} );
} );
