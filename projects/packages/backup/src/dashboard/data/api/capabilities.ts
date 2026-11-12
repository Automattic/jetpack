import { apiCall, apiPath } from './_helpers';

export type Capabilities = {
	hasBackupPlan: boolean;
	hasScan: boolean;
};

/**
 * Fetch the site's backup capabilities.
 *
 * Wrapped in `apiCall` (not raw `apiFetch`) so bridge errors come back as
 * `ApiError`s with a `code` field, matching the rest of the data-layer
 * fetchers.
 *
 * @return The capabilities payload.
 */
export async function fetchCapabilities(): Promise< Capabilities > {
	return apiCall< Capabilities >( { path: apiPath( '/site/capabilities' ) } );
}
