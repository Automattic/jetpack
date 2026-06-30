/*
 * Unit tests for cookie-consent utils.
 *
 * @jest-environment-options {"url": "https://shop.example.co.uk/"}
 */

import {
	UNKNOWN_COUNTRY_CODE,
	getCookie,
	getGeoConfig,
	handleConsentByRegion,
	isGdprCountry,
	pertainsToCCPA,
	setCookie,
} from '../src/modules/cookie-consent/utils';

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

	it( 'does not match a name that is only a substring of another cookie', () => {
		stubCookies( 'wp_consent_functional=allow' );

		expect( getCookie( 'consent' ) ).toBeNull();
	} );

	it( 'preserves "=" characters inside the value', () => {
		stubCookies( 'token=a=b=c; x=1' );

		expect( getCookie( 'token' ) ).toBe( 'a=b=c' );
	} );

	it( 'treats an explicitly empty cookie value as null', () => {
		// Current behavior: the `|| null` fallback collapses an empty string to null, so an
		// explicitly-empty cookie is indistinguishable from an absent one.
		stubCookies( 'wp_consent_functional=; x=1' );

		expect( getCookie( 'wp_consent_functional' ) ).toBeNull();
	} );
} );

describe( 'handleConsentByRegion (GDPR + GPC)', () => {
	const baseConfig = {
		gdprCountries: [ 'FR' ],
		ccpaRegions: [ 'california' ],
		gdprHonorsGpc: true,
	};

	let consentCalls: Array< [ string, string ] >;
	let originalGpc: PropertyDescriptor | undefined;

	const setGpc = ( value: boolean | undefined ) => {
		Object.defineProperty( window.navigator, 'globalPrivacyControl', {
			configurable: true,
			value,
		} );
	};

	beforeEach( () => {
		consentCalls = [];
		window.wp_set_consent = ( category: string, state: string ) => {
			consentCalls.push( [ category, state ] );
		};
		originalGpc = Object.getOwnPropertyDescriptor( window.navigator, 'globalPrivacyControl' );
	} );

	afterEach( () => {
		delete ( window as unknown as { wp_set_consent?: unknown } ).wp_set_consent;
		if ( originalGpc ) {
			Object.defineProperty( window.navigator, 'globalPrivacyControl', originalGpc );
		} else {
			delete ( window.navigator as unknown as { globalPrivacyControl?: unknown } )
				.globalPrivacyControl;
		}
	} );

	const wasDenied = ( category: string ) =>
		consentCalls.some( ( [ cat, state ] ) => cat === category && state === 'deny' );

	it( 'force-denies non-essential categories and hides the banner when GPC is present in a GDPR region', () => {
		setGpc( true );
		const context = { showBanner: false };

		handleConsentByRegion( 'FR', '', baseConfig, context );

		expect( context.showBanner ).toBe( false );
		expect( wasDenied( 'statistics' ) ).toBe( true );
		expect( wasDenied( 'marketing' ) ).toBe( true );
		// Functional/required cookies are always allowed.
		expect( consentCalls ).toContainEqual( [ 'functional', 'allow' ] );
	} );

	it( 'shows the opt-in banner when GPC is absent in a GDPR region', () => {
		setGpc( undefined );
		const context = { showBanner: false };

		handleConsentByRegion( 'FR', '', baseConfig, context );

		expect( context.showBanner ).toBe( true );
		expect( wasDenied( 'statistics' ) ).toBe( false );
	} );

	it( 'ignores GPC in a GDPR region when honoring is disabled by config', () => {
		setGpc( true );
		const context = { showBanner: false };

		handleConsentByRegion( 'FR', '', { ...baseConfig, gdprHonorsGpc: false }, context );

		expect( context.showBanner ).toBe( true );
		expect( wasDenied( 'statistics' ) ).toBe( false );
	} );

	it( 'honors GPC by default when the config flag is omitted', () => {
		setGpc( true );
		const context = { showBanner: false };

		handleConsentByRegion(
			'FR',
			'',
			{ gdprCountries: [ 'FR' ], ccpaRegions: [ 'california' ] },
			context
		);

		expect( context.showBanner ).toBe( false );
		expect( wasDenied( 'statistics' ) ).toBe( true );
	} );
} );

describe( 'geo configuration helpers', () => {
	it( 'prefers the nested geo schema over legacy top-level keys', () => {
		const config = getGeoConfig( {
			geoApiUrl: 'https://legacy.example.test/geo',
			countryCodeCookie: 'legacy_country',
			geo: {
				provider: 'custom',
				apiUrl: 'https://geo.example.test/lookup',
				countryCodeCookie: 'shopper_country',
				regionCookie: 'shopper_region',
				cookieDuration: 120,
				gdprCountries: [ 'gb' ],
				ccpaRegions: [ 'California' ],
				showOnError: false,
			},
		} );

		expect( config ).toMatchObject( {
			provider: 'custom',
			apiUrl: 'https://geo.example.test/lookup',
			countryCodeCookie: 'shopper_country',
			regionCookie: 'shopper_region',
			cookieDuration: 120,
			gdprCountries: [ 'GB' ],
			ccpaRegions: [ 'california' ],
			showOnError: false,
		} );
	} );

	it( 'returns defaults for an empty config', () => {
		expect( getGeoConfig( {} ) ).toEqual( {
			provider: 'wpcom',
			apiUrl: 'https://public-api.wordpress.com/geo/',
			countryCodeCookie: 'country_code',
			regionCookie: 'region',
			cookieDuration: 6 * 60 * 60,
			gdprCountries: [],
			ccpaRegions: [],
			showOnError: true,
		} );
	} );

	it( 'falls back to the remaining legacy top-level keys', () => {
		const config = getGeoConfig( {
			geoProvider: 'custom',
			geoApiUrl: 'https://legacy.example.test/geo',
			geoCookieDuration: 999,
			regionCookie: 'legacy_region',
			showOnError: false,
		} );

		expect( config ).toMatchObject( {
			provider: 'custom',
			apiUrl: 'https://legacy.example.test/geo',
			cookieDuration: 999,
			regionCookie: 'legacy_region',
			showOnError: false,
		} );
	} );

	it( 'uses configured GDPR country lists', () => {
		const config = {
			geo: {
				gdprCountries: [ 'ca' ],
			},
		};

		expect( isGdprCountry( 'CA', config ) ).toBe( true );
		expect( isGdprCountry( 'GB', config ) ).toBe( false );
		expect( isGdprCountry( UNKNOWN_COUNTRY_CODE, config ) ).toBe( true );
	} );

	it( 'uses configured CCPA regions case-insensitively', () => {
		const config = {
			geo: {
				ccpaRegions: [ 'Quebec' ],
			},
		};

		expect( pertainsToCCPA( 'US', 'Quebec', config ) ).toBe( true );
		expect( pertainsToCCPA( 'CA', 'Quebec', config ) ).toBe( false );
		expect( pertainsToCCPA( 'US', 'California', config ) ).toBe( false );
	} );

	it( 'normalizes legacy geo list aliases', () => {
		const config = getGeoConfig( {
			gdprCountries: [ 'ca' ],
			ccpaRegions: [ 'Quebec' ],
		} );

		expect( config.gdprCountries ).toEqual( [ 'CA' ] );
		expect( config.ccpaRegions ).toEqual( [ 'quebec' ] );
	} );
} );
