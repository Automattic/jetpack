import { safeHttpUrl } from '../safe-http-url';

describe( 'safeHttpUrl', () => {
	it.each( [ 'https://example.com/', 'http://example.com/path?query=1#hash' ] )(
		'returns HTTP(S) URLs unchanged: %s',
		url => {
			expect( safeHttpUrl( url ) ).toBe( url );
		}
	);

	it.each( [
		[ 'javascript scheme', 'javascript:alert(1)' ],
		[ 'mixed-case javascript scheme', 'JaVaScRiPt:alert(1)' ],
		[ 'whitespace-prefixed javascript scheme', '  javascript:alert(1)' ],
		[ 'embedded-tab javascript scheme', 'java\tscript:alert(1)' ],
		[ 'embedded-newline javascript scheme', 'java\nscript:alert(1)' ],
		[ 'data scheme', 'data:text/html,<script>alert(1)</script>' ],
		[ 'vbscript scheme', 'vbscript:msgbox(1)' ],
		[ 'file scheme', 'file:///etc/passwd' ],
		[ 'protocol-relative URL', '//example.com/' ],
		[ 'unparseable value', 'not a url' ],
		[ 'empty string', '' ],
	] )( 'rejects %s', ( _label, url ) => {
		expect( safeHttpUrl( url ) ).toBeNull();
	} );

	it( 'rejects undefined', () => {
		expect( safeHttpUrl( undefined ) ).toBeNull();
	} );

	it.each( [ null, 42, { href: 'https://example.com' } ] )( 'rejects non-strings: %p', url => {
		expect( safeHttpUrl( url ) ).toBeNull();
	} );

	describe( 'root-relative paths', () => {
		it( 'rejects them by default, so only the download sinks opt in', () => {
			expect( safeHttpUrl( '/relative/path' ) ).toBeNull();
		} );

		it.each( [ '/relative/path', '/report 2025.pdf', '/' ] )(
			'allows %s with allowRelative',
			url => {
				expect( safeHttpUrl( url, { allowRelative: true } ) ).toBe( url );
			}
		);

		// URL parsing strips tab/newline and normalizes `\` to `/`, so these resolve
		// cross-origin despite the single-slash prefix: `new URL( '/\\evil.example/x',
		// 'https://site.example/' )` is `https://evil.example/x`, and so is
		// `new URL( '/\t/evil.example/x', … )`.
		it.each( [
			[ 'backslash authority', '/\\evil.example/x' ],
			[ 'slash-backslash authority', '/\\/evil.example' ],
			[ 'protocol-relative URL', '//evil.example/x' ],
			[ 'tab-masked protocol-relative URL', '/\t/evil.example/x' ],
			[ 'newline-masked protocol-relative URL', '/\n/evil.example/x' ],
			[ 'CRLF-masked protocol-relative URL', '/\r\n/evil.example/x' ],
			[ 'tab-masked backslash authority', '/\t\\evil.example/x' ],
		] )( 'rejects %s even with allowRelative', ( _label, url ) => {
			expect( safeHttpUrl( url, { allowRelative: true } ) ).toBeNull();
		} );
	} );
} );
