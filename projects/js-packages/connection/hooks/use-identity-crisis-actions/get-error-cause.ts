import { getSiteRequestFailureCause } from '../../helpers/get-site-request-failure.ts';
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
 * @param error - The rejection; an `ApiError` carries the REST error body as `response`.
 * @return Why the request failed.
 */
export function getIdentityCrisisErrorCause( error: unknown ): IdentityCrisisErrorCause {
	const body = isObject( error ) ? error.response : undefined;
	const data = isObject( body ) ? body.data : undefined;
	const status = isObject( data ) && typeof data.status === 'number' ? data.status : null;

	// start-fresh sets `disconnected` when its registration failed.
	if ( isObject( data ) && data.disconnected === true ) {
		return 'disconnected';
	}

	const code = getIdentityCrisisErrorCode( error );
	// Safe Mode was resolved since the screen loaded, e.g. in another tab.
	if ( code === 'start_fresh_not_in_safe_mode' ) {
		return 'resolved';
	}

	const cause = getSiteRequestFailureCause( code, status );
	if ( cause ) {
		return cause;
	}
	if ( code === 'invalid_user_permission_identity_crisis' ) {
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
