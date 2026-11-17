import { afterEach, expect, it, jest } from '@jest/globals';

const API_URL = 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log';

await jest.unstable_mockModule( '@wordpress/interactivity', () => ( {
	store: jest.fn( () => ( { actions: {} } ) ),
	getContext: jest.fn(),
	getConfig: jest.fn( () => ( {
		geo: { countryCodeCookie: 'country_code', regionCookie: 'region', gdprCountries: [ 'FR' ] },
		gdprHonorsGpc: true,
	} ) ),
	withSyncEvent: jest.fn( ( callback: unknown ) => callback ),
} ) );

afterEach( () => {
	delete ( window as unknown as { wp_set_consent?: unknown } ).wp_set_consent;
	delete ( window.navigator as unknown as { globalPrivacyControl?: unknown } ).globalPrivacyControl;
} );

it( 'logs the GPC opt-out made when the module loads', async () => {
	Object.defineProperty( window.navigator, 'globalPrivacyControl', {
		configurable: true,
		value: true,
	} );
	Object.defineProperty( document, 'cookie', {
		configurable: true,
		get: () =>
			'wp_consent_functional=allow; wp_consent_statistics=allow; country_code=FR; region=Brittany',
		set: () => undefined,
	} );
	Object.defineProperty( window, 'wp_set_consent', { configurable: true, value: jest.fn() } );
	( window as unknown as { jetpackCookieConsentConfig?: unknown } ).jetpackCookieConsentConfig = {
		apiUrl: API_URL,
		features: {},
	};
	const fetchMock = jest.fn< typeof fetch >().mockResolvedValue( {
		ok: true,
		json: async () => ( {} ),
	} as unknown as Response );
	global.fetch = fetchMock;

	await import( '../src/modules/cookie-consent/index' );

	expect( fetchMock ).toHaveBeenCalledWith( API_URL, expect.anything() );
	const body = JSON.parse( String( fetchMock.mock.calls[ 0 ]?.[ 1 ]?.body ) );
	expect( body.event_type ).toBe( 'opt-out' );
} );
