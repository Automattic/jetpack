import { trackPrivacyBannerAccept } from '../src/modules/cookie-consent/tracks';

describe( 'trackPrivacyBannerAccept', () => {
	afterEach( () => {
		delete ( window as unknown as { _tkq?: unknown } )._tkq;
		delete ( window as unknown as { jetpackCookieConsentConfig?: unknown } )
			.jetpackCookieConsentConfig;
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

		trackPrivacyBannerAccept( {
			required: true,
			analytics: false,
			advertising: true,
			personalization: true,
		} );

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
	} );
} );
