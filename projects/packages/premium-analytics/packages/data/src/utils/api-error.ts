/**
 * Extract HTTP status code from common API error shapes.
 *
 * WordPress REST API errors and fetch errors can expose the status in
 * different places depending on which layer produced the failure.
 *
 * @param error - Unknown thrown error.
 * @return HTTP status code, or null when unavailable.
 */
export function getApiErrorStatus( error: unknown ): number | null {
	if ( ! error || typeof error !== 'object' ) {
		return null;
	}

	const err = error as Record< string, unknown >;

	if ( typeof err.status === 'number' ) {
		return err.status;
	}

	if ( err.data && typeof err.data === 'object' ) {
		const data = err.data as Record< string, unknown >;
		if ( typeof data.status === 'number' ) {
			return data.status;
		}
	}

	if ( err.response && typeof err.response === 'object' ) {
		const response = err.response as Record< string, unknown >;
		if ( typeof response.status === 'number' ) {
			return response.status;
		}
	}

	return null;
}

/**
 * Extract an API error code from common WordPress REST error shapes.
 *
 * @param error - Unknown thrown error.
 * @return Error code, or null when unavailable.
 */
export function getApiErrorCode( error: unknown ): string | null {
	if ( ! error || typeof error !== 'object' ) {
		return null;
	}

	const err = error as Record< string, unknown >;

	if ( typeof err.code === 'string' ) {
		return err.code;
	}

	if ( err.data && typeof err.data === 'object' ) {
		const data = err.data as Record< string, unknown >;
		if ( typeof data.code === 'string' ) {
			return data.code;
		}
	}

	return null;
}

export type StatsPlanErrorReason = 'upgrade-required' | null;

const NON_PLAN_FORBIDDEN_ERROR_CODES = new Set( [ 'no_connection' ] );

/**
 * Maps Stats API errors to widget-level plan error reasons.
 *
 * @param error - Unknown thrown error.
 * @return The plan error reason when the response is plan-gated.
 */
export function getStatsPlanErrorReason( error: unknown ): StatsPlanErrorReason {
	const errorCode = getApiErrorCode( error );

	return getApiErrorStatus( error ) === 403 &&
		! NON_PLAN_FORBIDDEN_ERROR_CODES.has( errorCode ?? '' )
		? 'upgrade-required'
		: null;
}

/**
 * Determine whether a failed API query should be retried.
 *
 * Authentication and authorization failures are deterministic for the current
 * user/session, so retrying only delays the widget-specific error UI.
 *
 * @param failureCount - Number of failed attempts so far.
 * @param error        - Unknown thrown error.
 * @return Whether React Query should retry.
 */
export function shouldRetryApiError( failureCount: number, error: unknown ): boolean {
	const status = getApiErrorStatus( error );

	if ( status === 401 || status === 403 ) {
		return false;
	}

	return failureCount < 3;
}
