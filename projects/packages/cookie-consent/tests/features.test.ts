/*
 * Unit tests for cookie-consent feature toggles.
 */

import { isFeatureEnabled } from '../src/modules/cookie-consent/features';

describe( 'isFeatureEnabled', () => {
	afterEach( () => {
		delete ( window as unknown as { jetpackCookieConsentConfig?: unknown } )
			.jetpackCookieConsentConfig;
	} );

	it( 'treats an unset feature as enabled', () => {
		expect( isFeatureEnabled( 'tracks' ) ).toBe( true );
	} );

	it( 'treats a feature as enabled when config is present but the flag is omitted', () => {
		window.jetpackCookieConsentConfig = {
			apiUrl: 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log',
			features: {},
		};

		expect( isFeatureEnabled( 'tracks' ) ).toBe( true );
	} );

	it( 'returns false only when the feature is explicitly disabled', () => {
		window.jetpackCookieConsentConfig = {
			apiUrl: 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log',
			features: {
				tracks: false,
			},
		};

		expect( isFeatureEnabled( 'tracks' ) ).toBe( false );
	} );

	it( 'works for arbitrary feature keys', () => {
		window.jetpackCookieConsentConfig = {
			apiUrl: 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log',
			features: {
				'some-future-feature': false,
			},
		};

		expect( isFeatureEnabled( 'some-future-feature' ) ).toBe( false );
		expect( isFeatureEnabled( 'another-feature' ) ).toBe( true );
	} );
} );
