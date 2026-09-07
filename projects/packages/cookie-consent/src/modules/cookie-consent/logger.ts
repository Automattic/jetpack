/**
 * Cookie Consent Controls Logger Integration
 *
 * Listens to consent events from the cookie consent controls and logs them via REST API.
 * The POST is gated on the `consent_log` feature: when it is off the REST route is not
 * registered server-side, so the logger stays silent instead of firing a request that 404s.
 *
 */

import { getCategoryPreferenceKey } from './category-preferences';
import { isFeatureEnabled } from './features';
import { getConsentCategories } from './utils';
import type { ConsentEventType, ConsentTypes, ConsentEvent } from './types';

interface ConsentLogResponse {
	consent_id?: string;
}

async function logConsentEvent(
	eventType: ConsentEventType,
	consentTypes: ConsentTypes
): Promise< string | undefined > {
	// Logging off: no route to POST to, and consent is already stored client-side.
	if ( ! isFeatureEnabled( 'consent_log' ) ) {
		return;
	}

	// Get API URL from config (passed from PHP).
	const apiUrl = window.jetpackCookieConsentConfig?.apiUrl;
	if ( ! apiUrl ) {
		// eslint-disable-next-line no-console
		console.error( 'Consent logger: API URL not configured' );
		return;
	}

	const headers: Record< string, string > = {
		'Content-Type': 'application/json',
	};
	// Send the REST nonce when present (logged-in visitors only) so the request
	// authenticates and the consent row records the real user_id instead of 0.
	const nonce = window.jetpackCookieConsentConfig?.nonce;
	if ( nonce ) {
		headers[ 'X-WP-Nonce' ] = nonce;
	}

	try {
		const response = await fetch( apiUrl, {
			method: 'POST',
			headers,
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
	return getConsentCategories().reduce< ConsentTypes >( ( consentTypes, category ) => {
		const preferenceKey = getCategoryPreferenceKey( category );
		consentTypes[ category.key ] = category.required ? true : choices[ preferenceKey ] === true;
		return consentTypes;
	}, {} );
}

async function handleConsentSaved( event: CustomEvent< ConsentEvent > ): Promise< void > {
	const { eventType, choices } = event.detail;
	const consentTypes = mapConsentTypes( choices );

	await logConsentEvent( eventType, consentTypes );
}

// Listen to consent events from the cookie banner
window.addEventListener( 'wp_consent_saved', handleConsentSaved as unknown as EventListener );
