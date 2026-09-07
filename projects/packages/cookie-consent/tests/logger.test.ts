/*
 * Behavior tests for the consent logger's REST POST gating.
 *
 * When the `consent_log` feature is off the REST route is not registered server-side, so the
 * logger must skip the POST rather than fire a request that 404s.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const API_URL = 'https://example.com/wp-json/jetpack/v4/cookie-consent/consent-log';

type ConsentConfig = { apiUrl?: string; features?: Record< string, boolean > };

/**
 * Publish the frontend consent config the logger reads at event time.
 *
 * @param {ConsentConfig} config - apiUrl and feature flags to expose under jetpackCookieConsentConfig.
 */
function setConfig( config: ConsentConfig ): void {
	(
		window as unknown as { jetpackCookieConsentConfig?: ConsentConfig }
	 ).jetpackCookieConsentConfig = config;
}

/**
 * Fire the wp_consent_saved event the logger listens for.
 */
function dispatchConsentSaved(): void {
	window.dispatchEvent(
		new CustomEvent( 'wp_consent_saved', {
			detail: { eventType: 'accept_all', choices: {} },
		} )
	);
}

let fetchMock: jest.Mock< typeof fetch >;

// Import once so exactly one wp_consent_saved listener is registered; the logger reads the
// feature flag and fetch afresh on each event, so per-test config/fetch changes take effect.
await import( '../src/modules/cookie-consent/logger' );

beforeEach( () => {
	fetchMock = jest.fn< typeof fetch >().mockResolvedValue( {
		ok: true,
		json: async () => ( { consent_id: 'abc' } ),
	} as unknown as Response );
	global.fetch = fetchMock;
} );

afterEach( () => {
	delete ( window as unknown as { jetpackCookieConsentConfig?: unknown } )
		.jetpackCookieConsentConfig;
} );

describe( 'consent logger REST gating', () => {
	it( 'posts the consent event when the consent_log feature is on', async () => {
		setConfig( { apiUrl: API_URL, features: { consent_log: true } } );

		dispatchConsentSaved();
		await Promise.resolve();

		expect( fetchMock ).toHaveBeenCalledWith(
			API_URL,
			expect.objectContaining( { method: 'POST' } )
		);
	} );

	it( 'stays silent when the consent_log feature is off', async () => {
		setConfig( { apiUrl: API_URL, features: { consent_log: false } } );

		dispatchConsentSaved();
		await Promise.resolve();

		expect( fetchMock ).not.toHaveBeenCalled();
	} );
} );
