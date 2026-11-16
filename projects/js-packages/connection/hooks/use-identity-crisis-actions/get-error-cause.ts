import type { IdentityCrisisErrorCause } from './types';

/**
 * Whether a value can be read by key.
 *
 * @param value - The value.
 * @return True for a non-null object.
 */
function isObject( value: unknown ): value is Record< string, unknown > {
	return typeof value === 'object' && value !== null;
}

/**
 * Classify what an `@automattic/jetpack-api` request rejected with.
 *
 * The client names each of its errors; an `ApiError` also carries the REST error body as `response`.
 *
 * @param error - The rejection.
 * @return Why the request failed.
 */
export function getIdentityCrisisErrorCause( error: unknown ): IdentityCrisisErrorCause {
	switch ( error instanceof Error ? error.name : undefined ) {
		// The request never reached the site.
		case 'FetchNetworkError':
			return 'offline';
		// A non-JSON answer or a missing route comes from a firewall, a security plugin or a PHP fatal, not the REST API.
		case 'JsonParseError':
		case 'JsonParseAfterRedirectError':
		case 'Api404Error':
		case 'Api404AfterRedirectError':
			return 'blocked';
	}

	const body = isObject( error ) ? error.response : undefined;
	const code = isObject( body ) ? body.code : undefined;
	const data = isObject( body ) ? body.data : undefined;
	const status = isObject( data ) && typeof data.status === 'number' ? data.status : null;

	// WordPress sends 401 when the request has no logged-in user, whatever the error code.
	if ( status === 401 ) {
		return 'session';
	}

	switch ( code ) {
		case 'rest_disabled':
			return 'blocked';
		// The client does not refresh an expired nonce, so a reload is what fixes it.
		case 'rest_cookie_invalid_nonce':
		case 'rest_not_logged_in':
			return 'session';
		// Logged in, but not allowed to resolve Safe Mode.
		case 'invalid_user_permission_identity_crisis':
		case 'rest_forbidden':
			return 'permission';
	}

	if ( status === 403 ) {
		return 'permission';
	}

	// The site answered with an error or an unusable response.
	return 'server';
}
