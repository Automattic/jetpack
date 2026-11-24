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
		// Reads these the way `getConnectScreenErrorMessage()` does; keep the two in step.
		// The request never completed: no connection, or a firewall, CDN or redirect in the way.
		case 'FetchNetworkError':
			return 'offline';
		// A non-JSON answer: something, usually a plugin or a PHP error, printed extra output.
		case 'JsonParseError':
		case 'JsonParseAfterRedirectError':
			return 'output';
		// The REST route is missing, so a security plugin or server rule is blocking it.
		case 'Api404Error':
		case 'Api404AfterRedirectError':
			return 'blocked';
	}

	const body = isObject( error ) ? error.response : undefined;
	const code = isObject( body ) ? body.code : undefined;
	const data = isObject( body ) ? body.data : undefined;
	const status = isObject( data ) && typeof data.status === 'number' ? data.status : null;

	// start-fresh sets `disconnected` when its registration failed.
	if ( isObject( data ) && data.disconnected === true ) {
		return 'disconnected';
	}

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

/**
 * The code to record for an `@automattic/jetpack-api` rejection, the same way `getRegistrationErrorCode()` reads one.
 *
 * @param error - The rejection.
 * @return The REST error code, else the error's name; undefined for a plain `Error` or a non-error.
 */
export function getIdentityCrisisErrorCode( error: unknown ): string | undefined {
	const body = isObject( error ) ? error.response : undefined;
	const code = isObject( body ) ? body.code : undefined;
	if ( typeof code === 'string' && code ) {
		return code;
	}
	return error instanceof Error && error.name !== 'Error' ? error.name : undefined;
}
