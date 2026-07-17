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

	it( 'allows root-relative paths', () => {
		expect( safeHttpUrl( '/relative/path' ) ).toBe( '/relative/path' );
	} );

	it.each( [ null, 42, { href: 'https://example.com' } ] )( 'rejects non-strings: %p', url => {
		expect( safeHttpUrl( url ) ).toBeNull();
	} );
} );
