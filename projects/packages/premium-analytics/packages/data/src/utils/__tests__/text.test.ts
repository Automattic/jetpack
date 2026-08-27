import { decodeHtmlString, decodeHtmlText } from '../text';

describe( 'decodeHtmlText', () => {
	it( 'decodes HTML entities and leaves non-strings alone', () => {
		expect( decodeHtmlText( 'Tea &amp; Crumpets&#8217; Best' ) ).toBe( 'Tea & Crumpets’ Best' );
		expect( decodeHtmlText( undefined ) ).toBeUndefined();
		expect( decodeHtmlText( 42 ) ).toBe( 42 );
		expect( decodeHtmlString( undefined ) ).toBe( '' );
		expect( decodeHtmlString( 'Tea &amp; Crumpets' ) ).toBe( 'Tea & Crumpets' );
	} );

	it( 'preserves entity-like URL query parameters without a trailing semicolon', () => {
		expect( decodeHtmlText( 'Tea &amp; Crumpets https://example.com/?a=1&copy=2' ) ).toBe(
			'Tea & Crumpets https://example.com/?a=1&copy=2'
		);
	} );
} );
