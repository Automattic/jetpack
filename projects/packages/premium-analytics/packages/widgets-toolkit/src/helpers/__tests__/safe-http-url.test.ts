/**
 * Internal dependencies
 */
import { safeHttpUrl } from '../safe-http-url';

describe( 'safeHttpUrl', () => {
	it.each( [
		[ 'https', 'https://example.com/path?q=1#frag' ],
		[ 'http', 'http://example.com/' ],
	] )( 'returns %s URLs unchanged', ( _scheme, url ) => {
		expect( safeHttpUrl( url ) ).toBe( url );
	} );

	it.each( [
		[ 'javascript', 'javascript:alert(1)' ],
		[ 'data', 'data:text/html,<script>alert(1)</script>' ],
		[ 'vbscript', 'vbscript:msgbox(1)' ],
		[ 'file', 'file:///etc/passwd' ],
	] )( 'rejects %s: URLs', ( _scheme, url ) => {
		expect( safeHttpUrl( url ) ).toBeNull();
	} );

	// These evasions must be rejected here rather than assumed to be filtered upstream.
	// `new URL()` normalizes all of them back to a `javascript:` protocol.
	it.each( [
		[ 'mixed case', 'JaVaScRiPt:alert(1)' ],
		[ 'leading whitespace', '  javascript:alert(1)' ],
		[ 'leading control characters', '\u0001javascript:alert(1)' ],
		[ 'embedded tab', 'java\tscript:alert(1)' ],
		[ 'embedded newline', 'java\nscript:alert(1)' ],
	] )( 'rejects %s javascript: URLs', ( _label, url ) => {
		expect( safeHttpUrl( url ) ).toBeNull();
	} );

	// The file-downloads report falls back to a root-relative `relative_url` when the API
	// omits `download_url`. Such a path carries no scheme and resolves against the page
	// origin, so it must survive the guard rather than lose its link.
	it( 'returns root-relative paths unchanged', () => {
		expect( safeHttpUrl( '/annual-report-2025.pdf' ) ).toBe( '/annual-report-2025.pdf' );
	} );

	it.each( [
		[ 'undefined', undefined ],
		[ 'null', null ],
		[ 'empty string', '' ],
		// Not a URL at all: WPCOM emits bare labels like this for some referrer rows.
		[ 'a bare label', 'WordPress Dashboard' ],
		// Protocol-relative: rejected because it is indistinguishable from a root-relative
		// path by prefix alone, and no Stats endpoint is known to return one.
		[ 'a protocol-relative URL', '//example.com/path' ],
		// Report items such as the archives rows type `link` as `unknown`, so a
		// non-string value is a shape the guard has to absorb rather than trust.
		[ 'a number', 42 ],
		[ 'an object', { href: 'https://example.com' } ],
	] )( 'returns null for %s', ( _label, url ) => {
		expect( safeHttpUrl( url ) ).toBeNull();
	} );
} );
