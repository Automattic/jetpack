/**
 * Authentication Provider for Agenttic Chat
 *
 * Mirrors the Jetpack implementation by using the
 * createJetpackAuthProvider helper from @automattic/agenttic-client.
 * This handles fetching and caching the JWT used to call WP.com
 * Agent APIs, and maps common errors to friendly messages.
 */

import {
	createJetpackAuthProvider,
	type JetpackApiError,
	type AuthProvider,
} from '@automattic/agenttic-client';
import { __ } from '@wordpress/i18n';

// Create a Jetpack-auth-backed auth provider with localized error messages
const baseAuthProvider = createJetpackAuthProvider( ( error: JetpackApiError ) => {
	if ( error?.code === 'rest_forbidden' ) {
		return __(
			'No permission to access the requested resource. Please check your Jetpack connection and permissions.',
			'media-editor'
		);
	}

	return __(
		'We could not verify your Jetpack connection. Please refresh and try again.',
		'media-editor'
	);
} );

// Wrap to log the Authorization token for debugging in development
const authProvider: AuthProvider = async () => {
	const headers = await baseAuthProvider();
	try {
		const authHeader = headers?.Authorization || headers?.authorization;
		if ( ! authHeader ) {
			console.warn(
				'[Agenttic][Auth] Missing Authorization header in auth provider response',
				headers
			);
		}
	} catch ( e ) {
		console.warn( '[Agenttic][Auth] Failed to log auth token', e );
	}
	return headers;
};

export default authProvider;
