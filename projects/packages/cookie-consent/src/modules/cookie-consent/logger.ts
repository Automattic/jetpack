/**
 * Shoppers Privacy Controls Logger Integration
 *
 * Listens to consent events from the shoppers privacy controls and logs them via REST API.
 * This file should only be loaded when consent logging is enabled.
 *
 */

import type { ConsentEventType, ConsentTypes, ConsentEvent } from './types';

interface ConsentLogResponse {
	consent_id?: string;
}

async function logConsentEvent(
	eventType: ConsentEventType,
	consentTypes: ConsentTypes
): Promise< string | undefined > {
	// Get API URL from config (passed from PHP).
	const apiUrl = window.jetpackCookieConsentConfig?.apiUrl;
	if ( ! apiUrl ) {
		// eslint-disable-next-line no-console
		console.error( 'Consent logger: API URL not configured' );
		return;
	}

	try {
		const response = await fetch( apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( {
				event_type: eventType,
				url: window.location.href,
				consent_types: consentTypes,
			} ),
		} );

		if ( ! response.ok ) {
			throw new Error( 'Failed to log consent' );
		}

		const data: ConsentLogResponse = await response.json();

		// Store consent ID in localStorage for future reference
		if ( data.consent_id ) {
			localStorage.setItem( 'jetpack_cookie_consent_id', data.consent_id );
		}

		return data.consent_id;
	} catch ( error: unknown ) {
		// eslint-disable-next-line no-console
		console.error( 'Consent logging failed:', error );
		// Don't throw - logging failure shouldn't break the UI
	}
}

function mapConsentTypes( choices: ConsentEvent[ 'choices' ] ): ConsentTypes {
	return {
		functional: true, // Always true
		analytics: choices.analytics || false,
		marketing: choices.advertising || false,
	};
}

async function handleConsentSaved( event: CustomEvent< ConsentEvent > ): Promise< void > {
	const { eventType, choices } = event.detail;
	const consentTypes = mapConsentTypes( choices );

	await logConsentEvent( eventType, consentTypes );
}

// Listen to consent events from the cookie banner
window.addEventListener( 'wp_consent_saved', handleConsentSaved as unknown as EventListener );
