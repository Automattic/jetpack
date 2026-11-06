/**
 * Marks a successful response whose shape cannot be sanitized.
 */
export class StatsResponseShapeError extends Error {}

// About a minute of retries while sync creates a store's analytics tables, which usually takes seconds.
const TABLES_NOT_READY_RETRIES = 20;
const TABLES_NOT_READY_RETRY_DELAY = 3000;

/**
 * Extract HTTP status code from common API error shapes.
 *
 * WordPress REST API errors and fetch errors can expose the status in
 * different places depending on which layer produced the failure.
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
 * WPCOM pass-through errors (every real Stats failure) put the code in `error`,
 * while our own `WP_Error` responses use `code`.
 */
export function getApiErrorCode( error: unknown ): string | null {
	if ( ! error || typeof error !== 'object' ) {
		return null;
	}

	const err = error as Record< string, unknown >;

	if ( typeof err.code === 'string' ) {
		return err.code;
	}

	if ( typeof err.error === 'string' ) {
		return err.error;
	}

	if ( err.data && typeof err.data === 'object' ) {
		const data = err.data as Record< string, unknown >;
		if ( typeof data.code === 'string' ) {
			return data.code;
		}
	}

	return null;
}

/**
 * Whether the failure means this user or session may not read the data.
 *
 * The proxy's `no_connection` 403 is not one: it flags a broken Jetpack
 * connection, which says nothing about permissions and can heal.
 */
export function isAccessDenied( error: unknown ): boolean {
	return getApiErrorStatus( error ) === 403 && getApiErrorCode( error ) !== 'no_connection';
}

/**
 * Whether WordPress.com has not created the store's analytics tables yet. Sync creates them seconds
 * after Premium Analytics is turned on, so the same request succeeds soon.
 */
export function isAnalyticsTablesNotReady( error: unknown ): boolean {
	return getApiErrorCode( error ) === 'woocommerce_analytics_tables_not_ready';
}

/**
 * Whether the store's analytics tables are at a schema version older than the report needs. Only the
 * store's next order or product sync upgrades them, so repeating the request does not help.
 */
export function isAnalyticsSchemaOutdated( error: unknown ): boolean {
	return getApiErrorCode( error ) === 'woocommerce_analytics_schema_outdated';
}

/**
 * Whether offering the reader a Retry can plausibly help — distinct from
 * `shouldRetryApiError`'s automatic policy: a 401/404 is worth a manual retry
 * even though auto-retrying it three times unprompted is not.
 */
export function isUserRetryableError( error: unknown ): boolean {
	return (
		! ( error instanceof StatsResponseShapeError ) &&
		! isAccessDenied( error ) &&
		! isAnalyticsSchemaOutdated( error )
	);
}

/**
 * Determine whether a failed API query should be retried.
 *
 * Authentication, authorization and not-found failures are deterministic for the
 * current user/session, so retrying only delays the widget-specific error UI.
 */
export function shouldRetryApiError( failureCount: number, error: unknown ): boolean {
	if ( error instanceof StatsResponseShapeError || isAnalyticsSchemaOutdated( error ) ) {
		return false;
	}

	if ( isAnalyticsTablesNotReady( error ) ) {
		return failureCount < TABLES_NOT_READY_RETRIES;
	}

	const status = getApiErrorStatus( error );

	if ( status === 401 || status === 403 || status === 404 ) {
		return false;
	}

	return failureCount < 3;
}

/**
 * The wait before the next automatic retry. A store waiting for its analytics tables is retried at a
 * steady pace, so the widget keeps its loading state until the tables exist; any other failure backs
 * off as React Query does by default.
 */
export function getApiRetryDelay( failureCount: number, error: unknown ): number {
	if ( isAnalyticsTablesNotReady( error ) ) {
		return TABLES_NOT_READY_RETRY_DELAY;
	}

	return Math.min( 1000 * 2 ** failureCount, 30000 );
}
