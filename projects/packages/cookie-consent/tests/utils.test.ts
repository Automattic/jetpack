/*
 * Unit tests for cookie-consent utils.
 *
 * @jest-environment-options {"url": "https://shop.example.co.uk/"}
 */

import {
	GPC_CHOICE_COOKIE,
	UNKNOWN_COUNTRY_CODE,
	applyGpcToStoredConsent,
	getConsentChoices,
	getCookie,
	getGeoConfig,
	handleConsentByRegion,
	hasAnalyticsConsent,
	hasConsentSet,
	hasGpcConflictWithStoredConsent,
	isGdprCountry,
	pertainsToCCPA,
	readConsentChoices,
	regionHonorsGpc,
	saveConsentChoices,
	setCookie,
} from '../src/modules/cookie-consent/utils';

class MockImage {
	set src( value: string ) {
		imageSources.push( value );
	}
}

let imageSources: string[];

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
	let originalImage: typeof Image;

	const setGpc = ( value: boolean | undefined ) => {
		Object.defineProperty( window.navigator, 'globalPrivacyControl', {
			configurable: true,
			value,
		} );
	};

	beforeEach( () => {
		consentCalls = [];
		imageSources = [];
		originalImage = global.Image;
		global.Image = MockImage as unknown as typeof Image;
		window.wp_set_consent = ( category: string, state: string ) => {
			consentCalls.push( [ category, state ] );
		};
		originalGpc = Object.getOwnPropertyDescriptor( window.navigator, 'globalPrivacyControl' );
	} );

	afterEach( () => {
		global.Image = originalImage;
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
		expect( imageSources ).toHaveLength( 0 );
	} );

	it( 'shows the opt-in banner when GPC is absent in a GDPR region', () => {
		setGpc( undefined );
		const context = { showBanner: false };

		handleConsentByRegion( 'FR', '', baseConfig, context );

		expect( context.showBanner ).toBe( true );
		expect( wasDenied( 'statistics' ) ).toBe( false );
		expect(
			new URL( imageSources[ 0 ] ).searchParams.get(
				'x_jetpack-cookie-consent-privacy-banner-view'
			)
		).toBe( `total,${ window.location.hostname }` );
	} );

	it( 'does not record a banner stat in CCPA regions', () => {
		setGpc( undefined );
		const context = { showBanner: false };

		handleConsentByRegion( 'US', 'california', baseConfig, context );

		expect( context.showBanner ).toBe( false );
		expect( imageSources ).toHaveLength( 0 );
	} );

	it( 'does not record a banner stat in non-regulated regions', () => {
		setGpc( undefined );
		const context = { showBanner: false };

		handleConsentByRegion( 'CA', '', baseConfig, context );

		expect( context.showBanner ).toBe( false );
		expect( imageSources ).toHaveLength( 0 );
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

	const wasAllowed = ( category: string ) =>
		consentCalls.some( ( [ cat, state ] ) => cat === category && state === 'allow' );

	it( 'auto-grants implied consent in a non-regulated region even when the banner is disabled', () => {
		setGpc( undefined );
		const context = { showBanner: false };

		handleConsentByRegion( 'CA', '', baseConfig, context, false );

		// The banner never surfaces, but consent must still be resolved: without this the
		// visitor is left with no consent state and tracking that should run never does.
		expect( context.showBanner ).toBe( false );
		expect( wasAllowed( 'statistics' ) ).toBe( true );
	} );

	it( 'auto-grants CCPA opt-out consent even when the banner is disabled', () => {
		setGpc( undefined );
		const context = { showBanner: false };

		handleConsentByRegion( 'US', 'california', baseConfig, context, false );

		expect( context.showBanner ).toBe( false );
		expect( wasAllowed( 'statistics' ) ).toBe( true );
	} );

	it( 'keeps the GDPR banner hidden and records no stat when the banner is disabled', () => {
		setGpc( undefined );
		const context = { showBanner: false };

		handleConsentByRegion( 'FR', '', baseConfig, context, false );

		expect( context.showBanner ).toBe( false );
		expect( imageSources ).toHaveLength( 0 );
	} );

	it( 'still honors GPC opt-out in a GDPR region when the banner is disabled', () => {
		setGpc( true );
		const context = { showBanner: false };

		handleConsentByRegion( 'FR', '', baseConfig, context, false );

		expect( context.showBanner ).toBe( false );
		expect( wasDenied( 'statistics' ) ).toBe( true );
	} );

	it( 'honors GPC in a CCPA region when GDPR honoring is off, and ignores it elsewhere', () => {
		setGpc( true );

		handleConsentByRegion(
			'US',
			'california',
			{ ...baseConfig, gdprHonorsGpc: false },
			{ showBanner: false }
		);
		expect( wasDenied( 'statistics' ) ).toBe( true );

		consentCalls = [];
		handleConsentByRegion( 'US', 'texas', baseConfig, { showBanner: false } );
		expect( wasAllowed( 'statistics' ) ).toBe( true );
	} );
} );

describe( 'registry-driven consent choices', () => {
	let consentCalls: Array< [ string, string ] >;
	let originalCookie: PropertyDescriptor | undefined;

	beforeEach( () => {
		consentCalls = [];
		window.wp_set_consent = ( category: string, state: string ) => {
			consentCalls.push( [ category, state ] );
		};
		window.jetpackCookieConsentConfig = {
			apiUrl: 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log',
			categories: [
				{
					key: 'functional',
					preferenceKey: 'required',
					required: true,
					defaultChecked: true,
					wpConsentMap: [ 'functional', 'preferences' ],
				},
				{
					key: 'analytics',
					preferenceKey: 'analytics',
					required: false,
					defaultChecked: true,
					wpConsentMap: [ 'statistics', 'statistics-anonymous' ],
				},
				{
					key: 'marketing',
					preferenceKey: 'advertising',
					required: false,
					defaultChecked: false,
					wpConsentMap: [ 'marketing' ],
				},
				{
					key: 'personalization',
					preferenceKey: 'personalization',
					required: false,
					defaultChecked: false,
					wpConsentMap: [ 'personalization' ],
				},
			],
		};
		originalCookie = Object.getOwnPropertyDescriptor( Document.prototype, 'cookie' );
	} );

	afterEach( () => {
		delete ( window as unknown as { wp_set_consent?: unknown } ).wp_set_consent;
		delete ( window as unknown as { jetpackCookieConsentConfig?: unknown } )
			.jetpackCookieConsentConfig;
		delete ( document as unknown as { cookie?: string } ).cookie;
		if ( originalCookie ) {
			Object.defineProperty( Document.prototype, 'cookie', originalCookie );
		}
	} );

	it( 'writes required and configured category maps through WP Consent API', () => {
		saveConsentChoices( {
			analytics: false,
			advertising: true,
			personalization: true,
		} );

		expect( consentCalls ).toEqual( [
			[ 'functional', 'allow' ],
			[ 'preferences', 'allow' ],
			[ 'statistics', 'deny' ],
			[ 'statistics-anonymous', 'deny' ],
			[ 'marketing', 'allow' ],
			[ 'personalization', 'allow' ],
		] );
	} );

	it( 'derives choices from the registry, forcing required on and honoring defaultChecked', () => {
		expect( getConsentChoices() ).toEqual( {
			required: true,
			analytics: true,
			advertising: false,
			personalization: false,
		} );
		expect( getConsentChoices( false ) ).toEqual( {
			required: true,
			analytics: false,
			advertising: false,
			personalization: false,
		} );
		expect( getConsentChoices( true ) ).toEqual( {
			required: true,
			analytics: true,
			advertising: true,
			personalization: true,
		} );
	} );

	it( 'reports consent as set when a required-category cookie is present', () => {
		Object.defineProperty( document, 'cookie', {
			configurable: true,
			get: () => 'wp_consent_functional=allow',
		} );

		expect( hasConsentSet() ).toBe( true );
	} );

	it( 'ignores non-required category cookies when a required category exists', () => {
		Object.defineProperty( document, 'cookie', {
			configurable: true,
			get: () => 'wp_consent_statistics=allow',
		} );

		expect( hasConsentSet() ).toBe( false );
	} );

	it( 'falls back to checking all categories when none are required', () => {
		window.jetpackCookieConsentConfig = {
			apiUrl: 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log',
			categories: [
				{
					key: 'analytics',
					preferenceKey: 'analytics',
					required: false,
					defaultChecked: true,
					wpConsentMap: [ 'statistics' ],
				},
			],
		};
		Object.defineProperty( document, 'cookie', {
			configurable: true,
			get: () => 'wp_consent_statistics=deny',
		} );

		expect( hasConsentSet() ).toBe( true );
	} );

	it( 'reads configured consent choices from mapped WP Consent API cookies', () => {
		Object.defineProperty( document, 'cookie', {
			configurable: true,
			get: () =>
				'wp_consent_functional=allow; wp_consent_statistics=allow; wp_consent_statistics-anonymous=allow; wp_consent_marketing=deny; wp_consent_personalization=allow',
		} );

		expect( readConsentChoices() ).toEqual( {
			required: true,
			analytics: true,
			advertising: false,
			personalization: true,
		} );
	} );

	it( 'resolves analytics consent from the configured category registry', () => {
		expect(
			hasAnalyticsConsent( {
				required: true,
				analytics: true,
				advertising: false,
			} )
		).toBe( true );
		expect(
			hasAnalyticsConsent( {
				required: true,
				analytics: false,
				advertising: true,
			} )
		).toBe( false );
	} );

	it( 'resolves analytics consent from a custom analytics category preference key', () => {
		window.jetpackCookieConsentConfig = {
			apiUrl: 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log',
			categories: [
				{
					key: 'analytics',
					preferenceKey: 'measurement',
					required: false,
					defaultChecked: true,
					wpConsentMap: [ 'statistics' ],
				},
			],
		};

		expect(
			hasAnalyticsConsent( {
				measurement: true,
			} )
		).toBe( true );
		expect(
			hasAnalyticsConsent( {
				measurement: false,
			} )
		).toBe( false );
	} );

	it( 'dispatches the public wp_consent_saved event with event type and category choices', () => {
		let savedEvent: CustomEvent | undefined;
		const listener = ( event: Event ) => {
			savedEvent = event as CustomEvent;
		};
		window.addEventListener( 'wp_consent_saved', listener );

		saveConsentChoices(
			{
				analytics: true,
				advertising: false,
			},
			'accept_selected'
		);

		window.removeEventListener( 'wp_consent_saved', listener );

		expect( consentCalls ).toEqual( [
			[ 'functional', 'allow' ],
			[ 'preferences', 'allow' ],
			[ 'statistics', 'allow' ],
			[ 'statistics-anonymous', 'allow' ],
			[ 'marketing', 'deny' ],
		] );
		expect( savedEvent?.detail ).toEqual( {
			eventType: 'accept_selected',
			choices: {
				analytics: true,
				advertising: false,
			},
		} );
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

describe( 'GPC for a returning visitor', () => {
	const config = {
		gdprCountries: [ 'FR' ],
		ccpaRegions: [ 'california' ],
		gdprHonorsGpc: true,
	};
	const ALL_ALLOWED =
		'wp_consent_functional=allow; wp_consent_statistics=allow; wp_consent_statistics-anonymous=allow; wp_consent_marketing=allow';
	const ALL_DENIED =
		'wp_consent_functional=allow; wp_consent_statistics=deny; wp_consent_statistics-anonymous=deny; wp_consent_marketing=deny';

	let consentCalls: Array< [ string, string ] >;
	let savedEvents: CustomEvent[];
	let cookieJar: string;
	let cookieWrites: string[];
	let originalGpc: PropertyDescriptor | undefined;
	const onSaved = ( event: Event ) => savedEvents.push( event as CustomEvent );

	const setGpc = ( value: boolean | undefined ) => {
		Object.defineProperty( window.navigator, 'globalPrivacyControl', {
			configurable: true,
			value,
		} );
	};

	beforeEach( () => {
		consentCalls = [];
		savedEvents = [];
		cookieJar = '';
		cookieWrites = [];
		window.wp_set_consent = ( category: string, state: string ) => {
			consentCalls.push( [ category, state ] );
		};
		Object.defineProperty( document, 'cookie', {
			configurable: true,
			get: () => cookieJar,
			set: ( value: string ) => {
				cookieWrites.push( value );
			},
		} );
		originalGpc = Object.getOwnPropertyDescriptor( window.navigator, 'globalPrivacyControl' );
		window.addEventListener( 'wp_consent_saved', onSaved );
	} );

	afterEach( () => {
		window.removeEventListener( 'wp_consent_saved', onSaved );
		delete ( window as unknown as { wp_set_consent?: unknown } ).wp_set_consent;
		delete ( document as unknown as { cookie?: string } ).cookie;
		if ( originalGpc ) {
			Object.defineProperty( window.navigator, 'globalPrivacyControl', originalGpc );
		} else {
			delete ( window.navigator as unknown as { globalPrivacyControl?: unknown } )
				.globalPrivacyControl;
		}
	} );

	it( 'marks a choice saved with GPC on', () => {
		setGpc( true );

		saveConsentChoices( getConsentChoices( true ), 'accept_all' );

		expect( cookieWrites.some( write => write.startsWith( `${ GPC_CHOICE_COOKIE }=1;` ) ) ).toBe(
			true
		);
	} );

	it.each( [ 'accept_selected', 'reject_all' ] as const )(
		'marks a %s choice saved with GPC on',
		eventType => {
			setGpc( true );

			saveConsentChoices( getConsentChoices( eventType !== 'reject_all' ), eventType );

			expect( cookieWrites.some( write => write.startsWith( `${ GPC_CHOICE_COOKIE }=1;` ) ) ).toBe(
				true
			);
		}
	);

	it( 'does not mark consent the package auto-grants with GPC on', () => {
		setGpc( true );

		saveConsentChoices( getConsentChoices( true ), 'auto_granted' );

		expect( cookieWrites.some( write => write.startsWith( `${ GPC_CHOICE_COOKIE }=1;` ) ) ).toBe(
			false
		);
	} );

	it( 'clears an earlier mark when the package auto-grants consent', () => {
		setGpc( true );
		cookieJar = `${ GPC_CHOICE_COOKIE }=1`;

		saveConsentChoices( getConsentChoices( true ), 'auto_granted' );

		expect( cookieWrites.some( write => write.startsWith( `${ GPC_CHOICE_COOKIE }=;` ) ) ).toBe(
			true
		);
	} );

	it( 'opts out a GPC visitor auto-granted in an unregulated region whose next load is from a CCPA one', () => {
		// Brave sends GPC on every request. First visit from Texas: implied consent, no mark.
		setGpc( true );
		handleConsentByRegion( 'US', 'texas', config, { showBanner: false } );

		expect( savedEvents[ 0 ].detail.eventType ).toBe( 'auto_granted' );
		expect( cookieWrites.some( write => write.startsWith( `${ GPC_CHOICE_COOKIE }=1;` ) ) ).toBe(
			false
		);

		// Later visit from California with the auto-granted choice stored.
		cookieJar = ALL_ALLOWED;
		consentCalls = [];

		expect( applyGpcToStoredConsent( 'US', 'california', config ) ).toBe( true );
		expect( consentCalls ).toContainEqual( [ 'marketing', 'deny' ] );
	} );

	it( 'clears the mark when a choice is saved with GPC off', () => {
		setGpc( undefined );
		cookieJar = `${ GPC_CHOICE_COOKIE }=1`;

		saveConsentChoices( getConsentChoices( true ), 'accept_all' );

		expect( cookieWrites.some( write => write.startsWith( `${ GPC_CHOICE_COOKIE }=;` ) ) ).toBe(
			true
		);
	} );

	it( 'writes no mark when GPC is off and none exists', () => {
		setGpc( undefined );

		saveConsentChoices( getConsentChoices( true ), 'accept_all' );

		expect( cookieWrites.some( write => write.startsWith( GPC_CHOICE_COOKIE ) ) ).toBe( false );
	} );

	it( 'reports a conflict when GPC is on and a choice saved without it allows a category', () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;

		expect( hasGpcConflictWithStoredConsent() ).toBe( true );
	} );

	it( 'reports a conflict when only one mapped cookie of a category allows', () => {
		setGpc( true );
		cookieJar =
			'wp_consent_functional=allow; wp_consent_statistics=deny; wp_consent_statistics-anonymous=allow; wp_consent_marketing=deny';

		expect( hasGpcConflictWithStoredConsent() ).toBe( true );
	} );

	it( 'ignores an allowed WP Consent API category no package category maps', () => {
		setGpc( true );
		cookieJar = `${ ALL_DENIED }; wp_consent_preferences=allow`;

		expect( hasGpcConflictWithStoredConsent() ).toBe( false );
	} );

	it( 'reports no conflict without GPC', () => {
		setGpc( undefined );
		cookieJar = ALL_ALLOWED;

		expect( hasGpcConflictWithStoredConsent() ).toBe( false );
	} );

	it( 'reports no conflict when the stored choice already denies every optional category', () => {
		setGpc( true );
		cookieJar = ALL_DENIED;

		expect( hasGpcConflictWithStoredConsent() ).toBe( false );
	} );

	it( 'reports no conflict when the stored choice was made with GPC on', () => {
		setGpc( true );
		cookieJar = `${ ALL_ALLOWED }; ${ GPC_CHOICE_COOKIE }=1`;

		expect( hasGpcConflictWithStoredConsent() ).toBe( false );
	} );

	it( 'honors GPC under GDPR unless the config turns it off, always under CCPA, never elsewhere', () => {
		expect( regionHonorsGpc( 'FR', '', config ) ).toBe( true );
		expect( regionHonorsGpc( UNKNOWN_COUNTRY_CODE, '', config ) ).toBe( true );
		expect( regionHonorsGpc( 'FR', '', { ...config, gdprHonorsGpc: false } ) ).toBe( false );
		expect( regionHonorsGpc( 'US', 'California', { ...config, gdprHonorsGpc: false } ) ).toBe(
			true
		);
		expect( regionHonorsGpc( 'US', 'texas', config ) ).toBe( false );
	} );

	it( 'opts out a returning GDPR visitor who turned GPC on after allowing categories', () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;

		expect( applyGpcToStoredConsent( 'FR', '', config ) ).toBe( true );

		expect( consentCalls ).toEqual( [
			[ 'functional', 'allow' ],
			[ 'statistics', 'deny' ],
			[ 'statistics-anonymous', 'deny' ],
			[ 'marketing', 'deny' ],
		] );
		expect( savedEvents ).toHaveLength( 1 );
		expect( savedEvents[ 0 ].detail.eventType ).toBe( 'opt-out' );
		// The opt-out is not the visitor's own choice, so it does not mark one.
		expect( cookieWrites.some( write => write.startsWith( `${ GPC_CHOICE_COOKIE }=1;` ) ) ).toBe(
			false
		);
	} );

	it( 'opts out a returning visitor with geo off (unknown region)', () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;

		expect( applyGpcToStoredConsent( UNKNOWN_COUNTRY_CODE, '', config ) ).toBe( true );
	} );

	it( 'opts out a returning CCPA visitor', () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;

		expect( applyGpcToStoredConsent( 'US', 'california', config ) ).toBe( true );
	} );

	it( 'keeps the stored choice when GDPR GPC honoring is off', () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;

		expect( applyGpcToStoredConsent( 'FR', '', { ...config, gdprHonorsGpc: false } ) ).toBe(
			false
		);
		expect( consentCalls ).toHaveLength( 0 );
		expect( savedEvents ).toHaveLength( 0 );
	} );

	it( 'keeps the stored choice in an unregulated region', () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;

		expect( applyGpcToStoredConsent( 'US', 'texas', config ) ).toBe( false );
		expect( consentCalls ).toHaveLength( 0 );
		// No mark, so a later load from a region that honors GPC still opts it out.
		expect( cookieWrites ).toHaveLength( 0 );
	} );

	it( 'keeps a choice the visitor made with GPC on', () => {
		setGpc( true );
		cookieJar = `${ ALL_ALLOWED }; ${ GPC_CHOICE_COOKIE }=1`;

		expect( applyGpcToStoredConsent( 'FR', '', config ) ).toBe( false );
		expect( consentCalls ).toHaveLength( 0 );
	} );
} );
