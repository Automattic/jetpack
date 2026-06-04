/**
 * @jest-environment node
 */
import { fromDisplay, toDisplay } from '../title-format-tokens';
import type { TitleFormatToken } from '../settings-types';

describe( 'toDisplay', () => {
	it( 'renders a known placeholder token as a bracketed label', () => {
		expect( toDisplay( { type: 'token', value: 'site_name' } ) ).toBe( '[Site name]' );
		expect( toDisplay( { type: 'token', value: 'post_title' } ) ).toBe( '[Post title]' );
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
} );

describe( 'round-trip', () => {
	it( 'is stable for a mixed token/string structure', () => {
		const tokens: TitleFormatToken[] = [
			{ type: 'token', value: 'post_title' },
			{ type: 'string', value: ' | ' },
			{ type: 'token', value: 'site_name' },
		];
		expect( tokens.map( toDisplay ).map( fromDisplay ) ).toEqual( tokens );
	} );
} );
