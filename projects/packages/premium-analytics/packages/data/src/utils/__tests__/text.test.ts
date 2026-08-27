import { decodeHtmlText } from '../text';

describe( 'decodeHtmlText', () => {
	it( 'decodes HTML entities and leaves non-strings alone', () => {
		expect( decodeHtmlText( 'Tea &amp; Crumpets&#8217; Best' ) ).toBe( 'Tea & Crumpets’ Best' );
		expect( decodeHtmlText( undefined ) ).toBeUndefined();
		expect( decodeHtmlText( 42 ) ).toBe( 42 );
	} );

	it( 'decodes legacy entities without a trailing semicolon, so URLs must not be passed in', () => {
		expect( decodeHtmlText( 'https://example.com/?a=1&copy=2' ) ).toBe(
			'https://example.com/?a=1©=2'
		);
	} );
} );
