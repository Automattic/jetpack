/**
 * Unit tests for cookie-consent utils.
 *
 * @jest-environment-options {"url": "https://shop.example.co.uk/"}
 */

import { getCookie, setCookie } from '../src/modules/cookie-consent/utils';

describe( 'setCookie', () => {
	let writes: string[];
	let originalCookie: PropertyDescriptor | undefined;

	beforeEach( () => {
		writes = [];
		originalCookie = Object.getOwnPropertyDescriptor( Document.prototype, 'cookie' );
		Object.defineProperty( document, 'cookie', {
			configurable: true,
			get: () => '',
			set: ( value: string ) => {
				writes.push( value );
			},
		} );
	} );

	afterEach( () => {
		delete ( document as unknown as { cookie?: string } ).cookie;
		if ( originalCookie ) {
			Object.defineProperty( Document.prototype, 'cookie', originalCookie );
		}
	} );

	it( 'writes the name, value, path, expiry and SameSite attributes', () => {
		setCookie( 'my_cookie', 'yes', 3600 );

		expect( writes ).toHaveLength( 1 );
		expect( writes[ 0 ] ).toContain( 'my_cookie=yes' );
		expect( writes[ 0 ] ).toContain( 'path=/' );
		expect( writes[ 0 ] ).toContain( 'expires=' );
		expect( writes[ 0 ] ).toContain( 'SameSite=Strict' );
	} );

	it( 'honours a custom SameSite value', () => {
		setCookie( 'my_cookie', 'yes', 3600, 'Lax' );

		expect( writes[ 0 ] ).toContain( 'SameSite=Lax' );
	} );

	it( 'sets a host-only cookie with no domain attribute, even on multi-level TLDs', () => {
		// Regression: deriving `domain=.<last-two-labels>` yields an invalid public-suffix
		// domain on multi-level TLDs (e.g. `.co.uk`, `.com.br`) that browsers reject, so the
		// cookie never sets. Host-only cookies (no domain attribute) avoid this entirely.
		setCookie( 'my_cookie', 'yes', 3600 );

		expect( writes[ 0 ] ).not.toContain( 'domain=' );
	} );
} );

describe( 'getCookie', () => {
	let originalCookie: PropertyDescriptor | undefined;

	beforeEach( () => {
		originalCookie = Object.getOwnPropertyDescriptor( Document.prototype, 'cookie' );
	} );

	afterEach( () => {
		delete ( document as unknown as { cookie?: string } ).cookie;
		if ( originalCookie ) {
			Object.defineProperty( Document.prototype, 'cookie', originalCookie );
		}
	} );

	const stubCookies = ( value: string ) =>
		Object.defineProperty( document, 'cookie', {
			configurable: true,
			get: () => value,
		} );

	it( 'returns the value of a cookie that is present', () => {
		stubCookies( 'a=1; wp_consent_functional=allow; b=2' );

		expect( getCookie( 'wp_consent_functional' ) ).toBe( 'allow' );
	} );

	it( 'returns null when the cookie is absent', () => {
		stubCookies( 'a=1; b=2' );

		expect( getCookie( 'missing' ) ).toBeNull();
	} );
} );
