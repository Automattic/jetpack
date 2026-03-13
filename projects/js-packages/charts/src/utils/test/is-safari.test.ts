import { isSafari } from '../is-safari';

describe( 'isSafari', () => {
	const originalNavigator = globalThis.navigator;

	afterEach( () => {
		// Restore original navigator after each test
		globalThis.navigator = originalNavigator;
	} );

	it( 'returns false when navigator is undefined', () => {
		// Simulate SSR environment where navigator is undefined
		Object.defineProperty( globalThis, 'navigator', {
			value: undefined,
			writable: true,
			configurable: true,
		} );

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false when navigator.userAgent is undefined', () => {
		// Mock navigator without userAgent
		globalThis.navigator = {} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false when navigator.userAgent is empty string', () => {
		globalThis.navigator = { userAgent: '' } as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns true for Safari user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( true );
	} );

	it( 'returns true for Safari iOS user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( true );
	} );

	it( 'returns false for Chrome user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false for Firefox user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:138.0) Gecko/20100101 Firefox/138.0',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false for Android Chrome user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false for Edge user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );
} );
