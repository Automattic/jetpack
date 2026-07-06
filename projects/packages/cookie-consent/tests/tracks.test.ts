import {
	trackPrivacyBannerAccept,
	trackPrivacyBannerCustomize,
	trackPrivacyBannerReject,
	trackPrivacyBannerView,
	trackPrivacyManageOpen,
	trackPrivacyPolicyOptOut,
} from '../src/modules/cookie-consent/tracks';

const TRACKS_SCRIPT_ID = 'jetpack-cookie-consent-tracks-js';

class MockImage {
	set src( value: string ) {
		imageSources.push( value );
	}
}

let imageSources: string[];

describe( 'trackPrivacyBannerAccept', () => {
	let originalImage: typeof Image;

	beforeEach( () => {
		imageSources = [];
		originalImage = global.Image;
		global.Image = MockImage as unknown as typeof Image;
	} );

	afterEach( () => {
		global.Image = originalImage;
		delete ( window as unknown as { _tkq?: unknown } )._tkq;
		delete ( window as unknown as { jetpackCookieConsentConfig?: unknown } )
			.jetpackCookieConsentConfig;
		document.getElementById( TRACKS_SCRIPT_ID )?.remove();
	} );

	it( 'keeps default preference props and adds custom category props', () => {
		window.jetpackCookieConsentConfig = {
			apiUrl: 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log',
			eventPrefix: 'jetpack',
			categories: [
				{
					key: 'functional',
					preferenceKey: 'required',
					required: true,
					defaultChecked: true,
					wpConsentMap: [ 'functional' ],
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

		trackPrivacyBannerAccept(
			{
				required: true,
				analytics: false,
				advertising: true,
				personalization: true,
			},
			true
		);

		expect( window._tkq?.[ 0 ] ).toEqual( [
			'recordEvent',
			'jetpack_privacy_banner_button_accept',
			expect.objectContaining( {
				preferences_required: true,
				preferences_analytics: false,
				preferences_advertising: true,
				preferences_personalization: true,
			} ),
		] );
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
	} );

	it( 'keeps default preference props as booleans for partial preferences', () => {
		trackPrivacyBannerAccept(
			{
				required: true,
			},
			true
		);

		expect( window._tkq?.[ 0 ] ).toEqual( [
			'recordEvent',
			'jetpack_privacy_banner_button_accept',
			expect.objectContaining( {
				preferences_required: true,
				preferences_analytics: false,
				preferences_advertising: false,
			} ),
		] );
	} );

	it( 'records accept through a cookieless aggregate stat when analytics is declined', () => {
		// Saving preferences with analytics unchecked must not load the
		// cookie-setting Tracks bundle the visitor just declined.
		trackPrivacyBannerAccept(
			{
				required: true,
				analytics: false,
				advertising: false,
			},
			false
		);

		expect( window._tkq ).toBeUndefined();
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
		const url = new URL( imageSources[ 0 ] );
		expect( url.searchParams.get( 'x_jetpack-cookie-consent-privacy-banner-button-accept' ) ).toBe(
			`total,${ window.location.hostname }`
		);
	} );

	it( 'records banner views through a cookieless aggregate stat', () => {
		trackPrivacyBannerView();

		expect( window._tkq ).toBeUndefined();
		expect( imageSources ).toHaveLength( 1 );

		const url = new URL( imageSources[ 0 ] );
		expect( url.origin + url.pathname ).toBe( 'https://pixel.wp.com/g.gif' );
		expect( url.searchParams.get( 'v' ) ).toBe( 'wpcom-no-pv' );
		expect( url.searchParams.get( 'x_jetpack-cookie-consent-privacy-banner-view' ) ).toBe(
			`total,${ window.location.hostname }`
		);
	} );

	it( 'records customize clicks through a cookieless aggregate stat', () => {
		trackPrivacyBannerCustomize();

		expect( window._tkq ).toBeUndefined();
		const url = new URL( imageSources[ 0 ] );
		expect(
			url.searchParams.get( 'x_jetpack-cookie-consent-privacy-banner-button-customize' )
		).toBe( `total,${ window.location.hostname }` );
	} );

	it( 'records pre-consent manage opens through a cookieless aggregate stat', () => {
		trackPrivacyManageOpen( false, false );

		expect( window._tkq ).toBeUndefined();
		const url = new URL( imageSources[ 0 ] );
		expect( url.searchParams.get( 'x_jetpack-cookie-consent-privacy-manage-open' ) ).toBe(
			`total,${ window.location.hostname }`
		);
	} );

	it( 'records post-consent manage opens through a cookieless aggregate stat when analytics is denied', () => {
		trackPrivacyManageOpen( true, false );

		expect( window._tkq ).toBeUndefined();
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
		const url = new URL( imageSources[ 0 ] );
		expect( url.searchParams.get( 'x_jetpack-cookie-consent-privacy-manage-open' ) ).toBe(
			`total,${ window.location.hostname }`
		);
	} );

	it( 'records post-consent manage opens through analytics-gated Tracks when analytics is allowed', () => {
		trackPrivacyManageOpen( true, true );

		expect( window._tkq?.[ 0 ] ).toEqual( [
			'recordEvent',
			'jetpack_privacy_manage_open',
			expect.objectContaining( {
				domain: window.location.hostname,
			} ),
		] );
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
	} );

	it( 'loads w.js with a weekly cache-busting ver query param', () => {
		trackPrivacyManageOpen( true, true );

		const script = document.getElementById( TRACKS_SCRIPT_ID ) as HTMLScriptElement;
		const url = new URL( script.src );
		expect( url.origin + url.pathname ).toBe( 'https://stats.wp.com/w.js' );
		expect( url.searchParams.get( 'ver' ) ).toBe( String( Math.floor( Date.now() / 6.048e8 ) ) );
	} );

	it( 'records reject through a cookieless aggregate stat', () => {
		trackPrivacyBannerReject();

		expect( window._tkq ).toBeUndefined();
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
		const url = new URL( imageSources[ 0 ] );
		expect( url.searchParams.get( 'x_jetpack-cookie-consent-privacy-banner-button-reject' ) ).toBe(
			`total,${ window.location.hostname }`
		);
	} );

	it( 'records opt-out through a cookieless aggregate stat', () => {
		trackPrivacyPolicyOptOut();

		expect( window._tkq ).toBeUndefined();
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
		const url = new URL( imageSources[ 0 ] );
		expect(
			url.searchParams.get( 'x_jetpack-cookie-consent-privacy-policy-page-button-opt-out' )
		).toBe( `total,${ window.location.hostname }` );
	} );

	it( 'honors the tracks feature flag for cookie-based Tracks events', () => {
		window.jetpackCookieConsentConfig = {
			apiUrl: 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log',
			features: {
				tracks: false,
			},
		};

		// A post-consent manage open is a cookie-based Tracks event, so the flag
		// must suppress both the queued event and the w.js load.
		trackPrivacyManageOpen( true, true );

		expect( window._tkq ).toBeUndefined();
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
	} );
} );
