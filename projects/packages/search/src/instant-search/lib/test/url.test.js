/**
 * Internal dependencies
 */
import { hasSameHost, isRelativeUrl } from '../url';

describe( 'isRelativeUrl', () => {
	test( 'returns false for well-formed full URLs', () => {
		expect( isRelativeUrl( 'http://example.com' ) ).toBeFalsy();
		expect( isRelativeUrl( 'https://example.com' ) ).toBeFalsy();
		expect( isRelativeUrl( 'httpS://example.com' ) ).toBeFalsy();
		expect( isRelativeUrl( 'file://example.com' ) ).toBeFalsy();
	} );

	test( 'returns true for well-formed partial URLs', () => {
		expect( isRelativeUrl( '/foo/bar' ) ).toBeTruthy();
		expect( isRelativeUrl( 'foo/bar' ) ).toBeTruthy();
		expect( isRelativeUrl( 'foo' ) ).toBeTruthy();
	} );

	test( 'returns false for mailto, data, and protocol-less URLs', () => {
		expect( isRelativeUrl( 'mailto:someone@example.com' ) ).toBeFalsy();
		expect( isRelativeUrl( 'data:text/plain;base64,blahblahblah' ) ).toBeFalsy();
		expect( isRelativeUrl( '//example.com' ) ).toBeFalsy();
	} );

	test( 'returns false for broken URLs', () => {
		expect( isRelativeUrl( 'ht,tp://example.com' ) ).toBeFalsy();
	} );
} );

describe( 'hasSameHost', () => {
	test( 'returns true if either input is a relative URL', () => {
		expect( hasSameHost( 'http://example.com', '/' ) ).toBeTruthy();
		expect( hasSameHost( '/', 'https://example.com' ) ).toBeTruthy();
	} );

	test( 'correctly compares URLs with the same protocol', () => {
		expect( hasSameHost( 'https://example.com', 'https://example.com' ) ).toBeTruthy();
		expect( hasSameHost( 'http://example.com', 'http://example.com' ) ).toBeTruthy();
		expect( hasSameHost( '//example.com', '//example.com' ) ).toBeTruthy();
		expect( hasSameHost( 'https://example.com', 'https://example2.com' ) ).toBeFalsy();
		expect( hasSameHost( 'http://example.com', 'http://example2.com' ) ).toBeFalsy();
		expect( hasSameHost( '//example.com', '//example2.com' ) ).toBeFalsy();
	} );

	test( 'correctly compares URLs with different protocols', () => {
		expect( hasSameHost( 'https://example.com', 'http://example.com' ) ).toBeTruthy();
		expect( hasSameHost( 'https://example.com', '//example.com' ) ).toBeTruthy();
		expect( hasSameHost( 'https://example.com', 'http://example2.com' ) ).toBeFalsy();
		expect( hasSameHost( 'https://example.com', '//example2.com' ) ).toBeFalsy();
	} );
} );
